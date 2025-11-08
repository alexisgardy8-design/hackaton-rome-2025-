import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

// XRPL Client singleton
let client = null;

/**
 * Get or create XRPL client connection
 * @returns {Promise<Client>} Connected XRPL client
 */
export const getClient = async () => {
  if (client && client.isConnected()) {
    return client;
  }

  const serverUrl = process.env.XRPL_SERVER || 'wss://s.altnet.rippletest.net:51233';
  
  client = new Client(serverUrl);
  
  try {
    await client.connect();
    console.log(`✅ Connected to XRPL: ${serverUrl}`);
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to XRPL:', error);
    throw new Error('Failed to connect to XRPL network');
  }
};

/**
 * Disconnect XRPL client
 */
export const disconnectClient = async () => {
  if (client && client.isConnected()) {
    await client.disconnect();
    console.log('✅ Disconnected from XRPL');
  }
};

/**
 * Get platform wallet from seed
 * @returns {Wallet} Platform wallet instance
 */
export const getPlatformWallet = () => {
  const seed = process.env.XRPL_PLATFORM_SEED;
  
  if (!seed) {
    throw new Error('XRPL_PLATFORM_SEED not configured in environment');
  }

  try {
    const wallet = Wallet.fromSeed(seed);
    console.log(`💼 Platform wallet address: ${wallet.address}`);
    return wallet;
  } catch (error) {
    console.error('❌ Failed to create wallet from seed:', error);
    throw new Error('Invalid XRPL platform seed');
  }
};

/**
 * Send XRP payment from platform wallet
 * @param {string} destination - Destination wallet address
 * @param {number} amount - Amount in XRP (not drops)
 * @returns {Promise<Object>} Transaction result
 */
export const sendPayment = async (destination, amount) => {
  try {
    const xrplClient = await getClient();
    const wallet = getPlatformWallet();

    // Prepare payment transaction
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: destination,
      Amount: xrpToDrops(amount), // Convert XRP to drops
      Fee: '12' // Standard fee in drops
    };

    // Auto-fill fields like Sequence and LastLedgerSequence
    const prepared = await xrplClient.autofill(payment);
    
    // Sign the transaction
    const signed = wallet.sign(prepared);
    
    // Submit and wait for validation
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    console.log(`✅ Payment sent: ${amount} XRP to ${destination}`);
    console.log(`   Transaction hash: ${result.result.hash}`);

    return {
      success: true,
      hash: result.result.hash,
      validated: result.result.validated,
      amount: amount,
      destination: destination
    };
  } catch (error) {
    console.error('❌ Payment failed:', error);
    throw new Error(`Failed to send payment: ${error.message}`);
  }
};

/**
 * Verify transaction on XRPL
 * @param {string} txHash - Transaction hash to verify
 * @returns {Promise<Object>} Transaction details
 */
export const verifyTransaction = async (txHash) => {
  try {
    const xrplClient = await getClient();

    // Get transaction details
    const response = await xrplClient.request({
      command: 'tx',
      transaction: txHash
    });

    const tx = response.result;

    // Check if transaction is validated
    if (!tx.validated) {
      return {
        verified: false,
        message: 'Transaction not yet validated'
      };
    }

    // Check transaction result
    const success = tx.meta?.TransactionResult === 'tesSUCCESS';

    return {
      verified: true,
      success: success,
      hash: tx.hash,
      transactionType: tx.TransactionType,
      account: tx.Account,
      destination: tx.Destination,
      amount: tx.Amount ? (typeof tx.Amount === 'string' ? dropsToXrp(tx.Amount) : tx.Amount) : null,
      fee: tx.Fee ? dropsToXrp(tx.Fee) : null,
      date: tx.date,
      ledgerIndex: tx.ledger_index,
      validated: tx.validated,
      result: tx.meta?.TransactionResult
    };
  } catch (error) {
    console.error('❌ Transaction verification failed:', error);
    
    // Handle specific error: transaction not found
    if (error.data?.error === 'txnNotFound') {
      return {
        verified: false,
        message: 'Transaction not found on XRPL'
      };
    }

    throw new Error(`Failed to verify transaction: ${error.message}`);
  }
};

/**
 * Get account balance
 * @param {string} address - XRPL address
 * @returns {Promise<string>} Balance in XRP
 */
export const getAccountBalance = async (address) => {
  try {
    const xrplClient = await getClient();

    const response = await xrplClient.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });

    const balance = dropsToXrp(response.result.account_data.Balance);
    return balance;
  } catch (error) {
    console.error('❌ Failed to get account balance:', error);
    throw new Error(`Failed to get balance: ${error.message}`);
  }
};

/**
 * Validate XRPL address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidAddress = (address) => {
  try {
    // XRPL addresses start with 'r' and are 25-35 characters
    const regex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
    return regex.test(address);
  } catch (error) {
    return false;
  }
};

/**
 * Generate a new wallet (for testing purposes)
 * @returns {Object} Wallet object with address and seed
 */
export const generateWallet = async () => {
  try {
    const xrplClient = await getClient();
    const wallet = Wallet.generate();

    // Fund wallet on testnet using faucet
    if (process.env.NODE_ENV === 'development' || process.env.XRPL_SERVER?.includes('testnet') || process.env.XRPL_SERVER?.includes('altnet')) {
      try {
        await xrplClient.fundWallet(wallet);
        console.log(`✅ New wallet generated and funded on testnet`);
      } catch (fundError) {
        console.warn('⚠️  Wallet generated but funding failed. Use faucet manually.');
      }
    }

    return {
      address: wallet.address,
      seed: wallet.seed,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('❌ Failed to generate wallet:', error);
    throw new Error(`Failed to generate wallet: ${error.message}`);
  }
};

/**
 * Create a trustline for a token
 * @param {string} investorSeed - Investor's wallet seed
 * @param {string} tokenSymbol - Token currency code (e.g., "ABC")
 * @param {string} issuerAddress - Issuer's XRPL address
 * @param {string} limit - Trust limit (max tokens to hold, e.g., "1000000")
 * @returns {Promise<Object>} Transaction result
 */
export const createTrustLine = async (investorSeed, tokenSymbol, issuerAddress, limit = '1000000') => {
  const xrplClient = await getClient();
  const investorWallet = Wallet.fromSeed(investorSeed);

  try {
    const trustSet = {
      TransactionType: 'TrustSet',
      Account: investorWallet.address,
      LimitAmount: {
        currency: tokenSymbol,
        issuer: issuerAddress,
        value: limit
      }
    };

    console.log(`🔗 Creating trustline for ${tokenSymbol} from ${investorWallet.address} to ${issuerAddress}...`);

    const prepared = await xrplClient.autofill(trustSet);
    const signed = investorWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log(`✅ Trustline created successfully`);
      return {
        success: true,
        hash: result.result.hash,
        validated: result.result.validated,
        investorAddress: investorWallet.address,
        tokenSymbol,
        issuerAddress,
        limit
      };
    } else {
      throw new Error(`Trustline creation failed: ${result.result.meta.TransactionResult}`);
    }
  } catch (error) {
    console.error('❌ Failed to create trustline:', error);
    throw new Error(`Failed to create trustline: ${error.message}`);
  }
};

/**
 * Check if a trustline exists
 * @param {string} investorAddress - Investor's XRPL address
 * @param {string} tokenSymbol - Token currency code
 * @param {string} issuerAddress - Issuer's XRPL address
 * @returns {Promise<Object>} Trustline status and details
 */
export const checkTrustLine = async (investorAddress, tokenSymbol, issuerAddress) => {
  const xrplClient = await getClient();

  try {
    const accountLines = await xrplClient.request({
      command: 'account_lines',
      account: investorAddress,
      ledger_index: 'validated'
    });

    const trustline = accountLines.result.lines.find(
      line => line.currency === tokenSymbol && line.account === issuerAddress
    );

    if (trustline) {
      return {
        exists: true,
        balance: trustline.balance,
        limit: trustline.limit,
        currency: trustline.currency,
        account: trustline.account
      };
    }

    return {
      exists: false,
      message: `No trustline found for ${tokenSymbol} from ${issuerAddress}`
    };
  } catch (error) {
    // Account might not exist yet
    if (error.data?.error === 'actNotFound') {
      return {
        exists: false,
        message: 'Account not found on ledger'
      };
    }
    console.error('❌ Failed to check trustline:', error);
    throw new Error(`Failed to check trustline: ${error.message}`);
  }
};

/**
 * Send token payment from issuer to investor
 * @param {string} issuerSeed - Issuer's wallet seed
 * @param {string} destinationAddress - Investor's XRPL address
 * @param {string} tokenSymbol - Token currency code
 * @param {string} amount - Amount of tokens to send
 * @returns {Promise<Object>} Transaction result
 */
export const sendTokenPayment = async (issuerSeed, destinationAddress, tokenSymbol, amount) => {
  const xrplClient = await getClient();
  const issuerWallet = Wallet.fromSeed(issuerSeed);

  try {
    // First check if trustline exists
    const trustlineStatus = await checkTrustLine(destinationAddress, tokenSymbol, issuerWallet.address);
    
    if (!trustlineStatus.exists) {
      throw new Error(`Investor must create trustline first. No trustline found for ${tokenSymbol}`);
    }

    const payment = {
      TransactionType: 'Payment',
      Account: issuerWallet.address,
      Destination: destinationAddress,
      Amount: {
        currency: tokenSymbol,
        value: amount.toString(),
        issuer: issuerWallet.address
      }
    };

    console.log(`💸 Sending ${amount} ${tokenSymbol} from ${issuerWallet.address} to ${destinationAddress}...`);

    const prepared = await xrplClient.autofill(payment);
    const signed = issuerWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult === 'tesSUCCESS') {
      console.log(`✅ Token payment sent successfully`);
      return {
        success: true,
        hash: result.result.hash,
        validated: result.result.validated,
        from: issuerWallet.address,
        to: destinationAddress,
        amount,
        currency: tokenSymbol
      };
    } else {
      throw new Error(`Token payment failed: ${result.result.meta.TransactionResult}`);
    }
  } catch (error) {
    console.error('❌ Failed to send token payment:', error);
    throw new Error(`Failed to send token payment: ${error.message}`);
  }
};

/**
 * Get token balance for an account
 * @param {string} accountAddress - Account's XRPL address
 * @param {string} tokenSymbol - Token currency code
 * @param {string} issuerAddress - Issuer's XRPL address
 * @returns {Promise<string>} Token balance
 */
export const getTokenBalance = async (accountAddress, tokenSymbol, issuerAddress) => {
  const xrplClient = await getClient();

  try {
    const accountLines = await xrplClient.request({
      command: 'account_lines',
      account: accountAddress,
      ledger_index: 'validated'
    });

    const trustline = accountLines.result.lines.find(
      line => line.currency === tokenSymbol && line.account === issuerAddress
    );

    if (trustline) {
      return trustline.balance;
    }

    return '0';
  } catch (error) {
    if (error.data?.error === 'actNotFound') {
      return '0';
    }
    console.error('❌ Failed to get token balance:', error);
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
};

/**
 * Generate a unique token symbol based on campaign
 * @param {string} campaignTitle - Campaign title
 * @param {string} campaignId - Campaign ID (for uniqueness)
 * @returns {string} Token symbol (3 characters)
 */
export const generateTokenSymbol = (campaignTitle, campaignId) => {
  // Take first 3 letters of title (uppercase)
  let symbol = campaignTitle
    .replace(/[^a-zA-Z]/g, '') // Remove non-letters
    .toUpperCase()
    .substring(0, 3);
  
  // If less than 3 characters, pad with campaign ID
  if (symbol.length < 3) {
    const idPart = campaignId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    symbol = (symbol + idPart).substring(0, 3);
  }
  
  // Ensure exactly 3 characters
  if (symbol.length < 3) {
    symbol = symbol.padEnd(3, 'X');
  }
  
  return symbol;
};

/**
 * Send dividend payment (XRP or token) to an investor
 * @param {string} destinationAddress - Investor's XRPL wallet address
 * @param {string} amount - Amount to send
 * @param {string} asset - Asset to send: "XRP" or token currency code
 * @param {string} issuerAddress - Token issuer address (required for tokens, null for XRP)
 * @returns {Promise<Object>} Transaction result with hash
 */
export const sendDividendPayment = async (destinationAddress, amount, asset = 'XRP', issuerAddress = null) => {
  try {
    const xrplClient = await getClient();
    const platformWallet = getPlatformWallet();

    let payment;

    if (asset === 'XRP') {
      // XRP payment
      payment = {
        TransactionType: 'Payment',
        Account: platformWallet.address,
        Destination: destinationAddress,
        Amount: xrpToDrops(amount.toString())
      };
    } else {
      // Token payment
      if (!issuerAddress) {
        throw new Error('Issuer address is required for token payments');
      }

      payment = {
        TransactionType: 'Payment',
        Account: platformWallet.address,
        Destination: destinationAddress,
        Amount: {
          currency: asset,
          value: amount.toString(),
          issuer: issuerAddress
        }
      };
    }

    // Prepare and submit transaction
    const prepared = await xrplClient.autofill(payment);
    const signed = platformWallet.sign(prepared);
    const result = await xrplClient.submitAndWait(signed.tx_blob);

    // Check if transaction was successful
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
    }

    return {
      success: true,
      hash: result.result.hash,
      result: result.result
    };
  } catch (error) {
    console.error('❌ Failed to send dividend payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify if an address has sufficient balance for dividend
 * @param {string} address - XRPL wallet address
 * @param {string} asset - Asset type: "XRP" or token currency code
 * @param {string} issuerAddress - Token issuer (for tokens)
 * @returns {Promise<Object>} Balance info
 */
export const checkDividendBalance = async (address, asset = 'XRP', issuerAddress = null) => {
  try {
    if (asset === 'XRP') {
      const balance = await getBalance(address);
      return {
        asset: 'XRP',
        balance: balance,
        hasSufficient: parseFloat(balance) > 0
      };
    } else {
      const balance = await getTokenBalance(address, asset, issuerAddress);
      return {
        asset: asset,
        issuer: issuerAddress,
        balance: balance,
        hasSufficient: parseFloat(balance) > 0
      };
    }
  } catch (error) {
    console.error('❌ Failed to check dividend balance:', error);
    throw new Error(`Failed to check balance: ${error.message}`);
  }
};

// Utility export for XRP conversion
export { xrpToDrops, dropsToXrp };
