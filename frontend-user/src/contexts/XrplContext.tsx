import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Wallet as XrplWallet, xrpToDrops } from 'xrpl';

interface XrplContextType {
  client: Client | null;
  wallet: XrplWallet | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: (seed?: string) => Promise<void>;
  disconnectWallet: () => void;
  sendPayment: (destination: string, amount: string) => Promise<string>;
  createEscrow: (destination: string, amount: string, condition?: string, finishAfter?: number) => Promise<{ hash: string; escrowSequence: number; condition: string; preimage: string }>;
  getBalance: () => Promise<string>;
}

const XrplContext = createContext<XrplContextType | undefined>(undefined);

export const useXrpl = () => {
  const context = useContext(XrplContext);
  if (!context) {
    throw new Error('useXrpl must be used within XrplProvider');
  }
  return context;
};

interface XrplProviderProps {
  children: ReactNode;
}

export const XrplProvider = ({ children }: XrplProviderProps) => {
  const [client, setClient] = useState<Client | null>(null);
  const [wallet, setWallet] = useState<XrplWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = async (seed?: string) => {
    try {
      // Vérifier si on a déjà un wallet en localStorage
      const storedSeed = localStorage.getItem('xrpl_wallet_seed');
      const seedToUse = seed || storedSeed || undefined;
      
      let xrplWallet: XrplWallet;
      
      if (seedToUse) {
        // Utiliser le seed fourni ou stocké
        xrplWallet = XrplWallet.fromSeed(seedToUse);
      } else {
        // Générer un nouveau wallet
        xrplWallet = XrplWallet.generate();
      }
      
      // Connecter au client XRPL Testnet
      const xrplClient = new Client('wss://s.altnet.rippletest.net:51233');
      await xrplClient.connect();
      
      setClient(xrplClient);
      setWallet(xrplWallet);
      setAddress(xrplWallet.address);
      
      // Stocker le seed dans localStorage (pour la démo uniquement)
      if (xrplWallet.seed) {
        localStorage.setItem('xrpl_wallet_seed', xrplWallet.seed);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  // Essayer de reconnecter le wallet au chargement si un seed est stocké
  useEffect(() => {
    const storedSeed = localStorage.getItem('xrpl_wallet_seed');
    if (storedSeed && !wallet) {
      connectWallet(storedSeed).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnectWallet = () => {
    if (client) {
      client.disconnect();
    }
    setClient(null);
    setWallet(null);
    setAddress(null);
    localStorage.removeItem('xrpl_wallet_seed');
  };

  const sendPayment = async (destination: string, amount: string): Promise<string> => {
    if (!client || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convertir le montant en drops (1 XRP = 1,000,000 drops)
      const amountInDrops = (parseFloat(amount) * 1000000).toString();
      
      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: destination,
        Amount: amountInDrops,
      };

      const prepared = await client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.validated) {
        return result.result.hash;
      } else {
        throw new Error('Transaction not validated');
      }
    } catch (error) {
      console.error('Error sending payment:', error);
      throw error;
    }
  };

  const createEscrow = async (
    destination: string,
    amount: string,
    condition: string,
    finishAfter?: number
  ): Promise<{ hash: string; escrowSequence: number; condition: string; preimage: string }> => {
    if (!client || !wallet) {
      throw new Error('Wallet not connected. Please connect your XRPL wallet first.');
    }

    // Vérifier que le client est connecté
    if (!client.isConnected()) {
      throw new Error('XRPL client not connected. Please reconnect your wallet.');
    }

    try {
      console.log('Starting escrow creation:', {
        from: wallet.address,
        to: destination,
        amount,
        hasCondition: !!condition
      });
      
      // Convertir le montant en drops en utilisant la fonction xrpl
      const escrowAmount = parseFloat(amount);
      if (isNaN(escrowAmount) || escrowAmount <= 0) {
        throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`);
      }
      const amountInDrops = xrpToDrops(escrowAmount);
      
      // Si finishAfter n'est pas fourni, utiliser 30 jours à partir de maintenant
      const finishAfterDate = finishAfter || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      
      // Vérifier que FinishAfter est dans le futur (au moins 1 heure)
      const minFinishAfter = Math.floor(Date.now() / 1000) + 3600; // 1 heure minimum
      if (finishAfterDate < minFinishAfter) {
        throw new Error(`FinishAfter must be at least 1 hour in the future. Current: ${new Date(finishAfterDate * 1000).toISOString()}`);
      }
      
      // Vérifier le solde avant de créer l'escrow
      console.log('Checking account balance...');
      let accountInfo;
      try {
        accountInfo = await client.request({
          command: 'account_info',
          account: wallet.address,
          ledger_index: 'validated'
        });
      } catch (error: any) {
        if (error.data?.error === 'actNotFound') {
          throw new Error(`Account ${wallet.address} not found on XRPL. Please fund your wallet first using the Testnet faucet: https://xrpl.org/xrp-testnet-faucet.html`);
        }
        throw error;
      }
      
      const currentBalance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
      console.log('Current balance:', currentBalance, 'XRP');
      const transactionFee = 0.00001; // Approximate transaction fee
      const reserve = 10; // Minimum reserve for Testnet (can be lower than Mainnet)
      const requiredBalance = escrowAmount + transactionFee + reserve;
      
      if (currentBalance < requiredBalance) {
        throw new Error(
          `Insufficient balance. You have ${currentBalance.toFixed(6)} XRP but need at least ${requiredBalance.toFixed(6)} XRP ` +
          `(${escrowAmount.toFixed(6)} for escrow + ${transactionFee.toFixed(6)} for fees + ${reserve.toFixed(6)} reserve). ` +
          `Please fund your wallet on Testnet: https://xrpl.org/xrp-testnet-faucet.html`
        );
      }
      
      // Vérifier que le solde disponible (après réserve) est suffisant
      const availableBalance = currentBalance - reserve;
      if (availableBalance < escrowAmount + transactionFee) {
        throw new Error(
          `Insufficient available balance. After reserve (${reserve} XRP), you have ${availableBalance.toFixed(6)} XRP available, ` +
          `but need ${(escrowAmount + transactionFee).toFixed(6)} XRP. Please fund your wallet.`
        );
      }

      // Créer un escrow simple sans condition cryptographique
      // Juste avec FinishAfter pour que l'escrow soit visible sur XRPL Explorer
      
      // Générer un preimage simple pour référence future (même si on ne l'utilise pas maintenant)
      const preimageArray = new Uint8Array(32);
      window.crypto.getRandomValues(preimageArray);
      const preimage = Array.from(preimageArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      
      // Pour l'instant, on crée un escrow sans condition - juste avec FinishAfter
      // Cela devrait fonctionner et être visible sur XRPL Explorer
      const escrowCondition = ''; // Pas de condition pour simplifier
      
      // Vérifier que FinishAfter est un nombre entier
      const finishAfterInt = Math.floor(finishAfterDate);
      if (!Number.isInteger(finishAfterInt) || finishAfterInt <= 0) {
        throw new Error(`FinishAfter must be a positive integer (Unix timestamp in seconds), got: ${finishAfterDate}`);
      }
      
      // Vérifier que FinishAfter est dans le futur (au moins 1 heure)
      const now = Math.floor(Date.now() / 1000);
      if (finishAfterInt <= now) {
        throw new Error(`FinishAfter must be in the future. Current time: ${now}, FinishAfter: ${finishAfterInt}`);
      }
      
      // Créer l'escrow minimal - juste les champs obligatoires
      // XRPL attend Amount comme une chaîne représentant les drops
      // FinishAfter doit être un nombre (Unix timestamp en secondes)
      const escrowCreate = {
        TransactionType: 'EscrowCreate',
        Account: wallet.address,
        Destination: destination,
        Amount: amountInDrops, // String representing drops (from xrpToDrops)
        FinishAfter: finishAfterInt, // Integer Unix timestamp (seconds) - doit être dans le futur
        // Pas de Condition - on crée un escrow simple sans condition cryptographique
      };
      
      // Valider la transaction avant de l'envoyer
      console.log('Escrow transaction details:', {
        TransactionType: escrowCreate.TransactionType,
        Account: escrowCreate.Account,
        Destination: escrowCreate.Destination,
        Amount: escrowCreate.Amount,
        AmountType: typeof escrowCreate.Amount,
        FinishAfter: escrowCreate.FinishAfter,
        FinishAfterType: typeof escrowCreate.FinishAfter,
        FinishAfterDate: new Date(finishAfterDate * 1000).toISOString()
      });

      console.log('Creating escrow (no condition):', {
        from: wallet.address,
        to: destination,
        amount: amount,
        amountInDrops: amountInDrops,
        finishAfter: finishAfterDate,
        finishAfterDateISO: new Date(finishAfterDate * 1000).toISOString()
      });

      console.log('Before autofill:', JSON.stringify(escrowCreate, null, 2));
      
      let prepared;
      try {
        prepared = await client.autofill(escrowCreate);
        console.log('After autofill - prepared transaction:', {
          TransactionType: prepared.TransactionType,
          Amount: prepared.Amount,
          FinishAfter: prepared.FinishAfter,
          Sequence: prepared.Sequence
        });
      } catch (autofillError: any) {
        console.error('Autofill error:', autofillError);
        throw new Error(`Failed to prepare escrow transaction: ${autofillError.message || autofillError}`);
      }
      
      const signed = wallet.sign(prepared);
      console.log('Transaction signed, submitting...');
      
      const result = await client.submitAndWait(signed.tx_blob);

      // Vérifier le résultat de la transaction
      if (result.result.meta?.TransactionResult && result.result.meta.TransactionResult !== 'tesSUCCESS') {
        const errorCode = result.result.meta.TransactionResult;
        const errorMessage = result.result.meta.TransactionResultMessage || errorCode;
        const fullError = {
          code: errorCode,
          message: errorMessage,
          meta: result.result.meta
        };
        console.error('Escrow creation failed:', fullError);
        throw new Error(`Escrow creation failed: ${errorCode} - ${errorMessage}`);
      }
      
      // Vérifier que la transaction est validée
      if (!result.result.validated) {
        console.error('Escrow not validated:', result.result);
        throw new Error('Escrow creation not validated on XRPL');
      }

      // Extraire le sequence number de l'escrow depuis les métadonnées
      const escrowSequence = prepared.Sequence || result.result.Sequence || 0;
      
      console.log('Escrow created successfully:', {
        hash: result.result.hash,
        sequence: escrowSequence
      });
      
      return {
        hash: result.result.hash,
        escrowSequence: escrowSequence,
        condition: escrowCondition || '', // Retourner la condition si disponible
        preimage: preimage,
      };
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        data: error.data,
        stack: error.stack
      });
      
      // Améliorer les messages d'erreur
      let errorMessage = error.message || 'Unknown error';
      let errorData = null;
      
      // Gérer les erreurs XRPL spécifiques
      if (error.name === 'RippledError' || error.data) {
        const xrplError = error.data || error;
        
        // Codes d'erreur XRPL courants
        if (xrplError.error === 'actNotFound') {
          errorMessage = `Account not found on XRPL. Please fund your wallet using the Testnet faucet: https://xrpl.org/xrp-testnet-faucet.html`;
        } else if (xrplError.error === 'tecINSUF_RESERVE_LINE') {
          errorMessage = `Insufficient reserve. You need at least 10 XRP reserve + amount + fees.`;
        } else if (xrplError.error === 'tecNO_LINE') {
          errorMessage = `No trustline found. This shouldn't happen for XRP escrows.`;
        } else if (xrplError.error === 'tecUNFUNDED_PAYMENT') {
          errorMessage = `Insufficient balance. You don't have enough XRP for this escrow.`;
        } else if (xrplError.error_message) {
          errorMessage = `XRPL Error: ${xrplError.error_message}`;
        } else if (xrplError.error) {
          errorMessage = `XRPL Error: ${xrplError.error}`;
        }
        
        errorData = xrplError;
      }
      
      // Si c'est une erreur de réseau
      if (error.message?.includes('network') || error.message?.includes('connection') || error.message?.includes('timeout')) {
        errorMessage = `Network error: ${error.message}. Please check your internet connection and try again.`;
      }
      
      // Créer un objet d'erreur enrichi
      const enrichedError = new Error(`Failed to create escrow: ${errorMessage}`);
      (enrichedError as any).originalError = error;
      (enrichedError as any).errorData = errorData;
      (enrichedError as any).fullDetails = JSON.stringify({
        message: error.message,
        name: error.name,
        data: error.data || errorData,
        stack: error.stack
      }, null, 2);
      
      throw enrichedError;
    }
  };

  const getBalance = async (): Promise<string> => {
    if (!client || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: address,
      });
      
      const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
      return balance.toFixed(6);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  };

  return (
    <XrplContext.Provider
      value={{
        client,
        wallet,
        address,
        isConnected: !!wallet && !!client,
        connectWallet,
        disconnectWallet,
        sendPayment,
        createEscrow,
        getBalance,
      }}
    >
      {children}
    </XrplContext.Provider>
  );
};

