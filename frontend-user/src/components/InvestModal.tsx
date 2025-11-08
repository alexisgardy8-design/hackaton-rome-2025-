import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useXrpl } from '@/contexts/XrplContext';
import { useToast } from '@/hooks/use-toast';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  platformWallet: string;
  minAmount?: number;
  maxAmount?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const InvestModal = ({
  isOpen,
  onClose,
  campaignId,
  platformWallet,
  minAmount = 1,
  maxAmount = 10000,
}: InvestModalProps) => {
  const { isConnected, address, createEscrow, getBalance } = useXrpl();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'sending' | 'success' | 'error'>('input');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [escrowData, setEscrowData] = useState<{ condition: string; preimage: string; sequence: number } | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleOpen = async () => {
    if (isConnected) {
      await loadBalance();
    }
  };

  const handleInvest = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your XRPL wallet first',
        variant: 'destructive',
      });
      return;
    }

    const investAmount = parseFloat(amount);
    if (isNaN(investAmount) || investAmount < minAmount || investAmount > maxAmount) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between ${minAmount} and ${maxAmount} XRP`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setStep('sending');

    try {
      // For demo: Create XRPL escrow without backend authentication
      // In production, you would first create an investment intent via API
      
      // Step 1: Create XRPL escrow with condition (funds locked until conditions are met)
      // FinishAfter: 30 days from now (funds can be released after this date)
      // Condition: Preimage-SHA256 condition that will be fulfilled when campaign reaches 100%
      const finishAfter = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      const escrowResult = await createEscrow(platformWallet, amount, undefined, finishAfter);
      setTransactionHash(escrowResult.hash);
      setEscrowData({
        condition: escrowResult.condition,
        preimage: escrowResult.preimage,
        sequence: escrowResult.escrowSequence,
      });

      // Step 2: Try to create investment via API with escrow data (optional for demo)
      try {
        const investResponse = await fetch(`${API_BASE}/investments/invest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            amount: investAmount,
          }),
        });

        if (investResponse.ok) {
          const investData = await investResponse.json();
          const investmentId = investData.investment?.id || investData.id;
          
          if (investmentId && escrowData && address) {
            // Try to confirm investment with escrow data
            const confirmResponse = await fetch(`${API_BASE}/investments/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                investmentId,
                transactionHash: escrowResult.hash,
                escrowSequence: escrowData.sequence,
                escrowCondition: escrowData.condition,
                escrowPreimage: escrowData.preimage,
                investorAddress: address, // Send investor's XRPL address
              }),
            });
            
            // Even if confirmation fails, the XRPL escrow was created
            if (!confirmResponse.ok) {
              console.warn('Investment confirmation failed, but XRPL escrow was created');
            }
          }
        } else {
          console.warn('Investment API call failed, but XRPL escrow was created');
        }
      } catch (apiError) {
        // API call failed, but XRPL escrow was created
        console.warn('API call failed, but XRPL escrow was created:', apiError);
      }

      // Escrow created successfully on XRPL
      setStep('success');
      toast({
        title: 'Escrow Created Successfully!',
        description: `Your ${amount} XRP has been locked in escrow. Funds will be available after the finish date.`,
      });
    } catch (error: any) {
      console.error('Investment error:', error);
      setStep('error');
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Failed to create XRPL escrow';
      let fullErrorDetails = '';
      
      if (error.message) {
        errorMessage = error.message;
        fullErrorDetails = error.message;
      } else if (error.data?.error_message) {
        errorMessage = error.data.error_message;
        fullErrorDetails = JSON.stringify(error.data, null, 2);
      } else if (error.data) {
        fullErrorDetails = JSON.stringify(error.data, null, 2);
      } else if (typeof error === 'string') {
        errorMessage = error;
        fullErrorDetails = error;
      }
      
      // Si c'est une erreur XRPL, extraire plus de détails
      if (error.name === 'RippledError' || error.data) {
        const xrplError = error.data || error;
        if (xrplError.error) {
          errorMessage = `XRPL Error: ${xrplError.error}`;
          fullErrorDetails = JSON.stringify(xrplError, null, 2);
        }
        if (xrplError.error_message) {
          errorMessage = `XRPL Error: ${xrplError.error_message}`;
        }
      }
      
      // Utiliser fullDetails si disponible (depuis l'erreur enrichie)
      if ((error as any).fullDetails) {
        fullErrorDetails = (error as any).fullDetails;
      }
      
      setErrorDetails(fullErrorDetails || errorMessage);
      
      toast({
        title: 'Escrow Creation Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Afficher plus longtemps pour que l'utilisateur puisse lire
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setTransactionHash(null);
    setEscrowData(null);
    setErrorDetails(null);
    onClose();
  };

  const openExplorer = () => {
    if (transactionHash) {
      window.open(`https://testnet.xrpl.org/transactions/${transactionHash}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in Campaign</DialogTitle>
        <DialogDescription>
          Create an XRPL escrow to lock your investment funds until campaign conditions are met
        </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            {!isConnected ? (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning font-medium">
                  Please connect your XRPL wallet first
                </p>
              </div>
            ) : (
              <>
                {balance && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Your Balance</p>
                    <p className="text-2xl font-bold text-primary">{balance} XRP</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="amount">Amount (XRP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={minAmount}
                    max={maxAmount}
                    step="0.1"
                    placeholder={`${minAmount} - ${maxAmount} XRP`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: {minAmount} XRP | Max: {maxAmount} XRP
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Platform Wallet</p>
                  <p className="text-sm font-mono break-all">{platformWallet}</p>
                </div>
                <Button
                  onClick={handleInvest}
                  disabled={!amount || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Invest Now'
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'sending' && (
          <div className="space-y-4 text-center py-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold">Creating Escrow...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we create the escrow to lock your funds on XRPL
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <CheckCircle className="h-16 w-16 text-success mb-4" />
              <p className="text-lg font-semibold">Escrow Created Successfully!</p>
              <p className="text-sm text-muted-foreground mb-2">
                Your funds have been locked in escrow on XRPL Testnet
              </p>
              <p className="text-xs text-muted-foreground">
                Funds will be available to the platform after the finish date (30 days)
              </p>
            </div>
            {transactionHash && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground mb-2">Escrow Transaction Hash</p>
                <p className="text-sm font-mono break-all mb-3">{transactionHash}</p>
                {escrowData && (
                  <div className="mb-3 p-2 rounded bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Escrow Condition</p>
                    <p className="text-xs font-mono break-all">{escrowData.condition}</p>
                    <p className="text-xs text-muted-foreground mt-2 mb-1">Preimage (save this!)</p>
                    <p className="text-xs font-mono break-all">{escrowData.preimage}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={openExplorer}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on XRPL Explorer
                </Button>
              </div>
            )}
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-lg font-semibold">Escrow Creation Failed</p>
              <p className="text-sm text-muted-foreground mb-2">
                There was an error creating the escrow for your investment
              </p>
              {transactionHash && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mt-2 w-full">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash (for reference)</p>
                  <p className="text-xs font-mono break-all">{transactionHash}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openExplorer}
                    className="mt-2 w-full"
                  >
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View on XRPL Explorer
                  </Button>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">Error Details</p>
              {errorDetails ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-mono break-all bg-background/50 p-2 rounded">
                    {errorDetails}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Check the browser console (F12) for more details
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Common issues:
              </p>
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside space-y-1">
                <li>Insufficient XRP balance (need amount + fees + 10 XRP reserve)</li>
                <li>Wallet not funded on Testnet - Use faucet: https://xrpl.org/xrp-testnet-faucet.html</li>
                <li>Network connection issues</li>
                <li>Wallet not properly connected</li>
              </ul>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

