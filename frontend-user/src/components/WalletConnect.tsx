import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useXrpl } from '@/contexts/XrplContext';
import { useToast } from '@/hooks/use-toast';

export const WalletConnect = () => {
  const { isConnected, address, connectWallet, disconnectWallet, getBalance } = useXrpl();
  const [isOpen, setIsOpen] = useState(false);
  const [seed, setSeed] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isConnected && address) {
      loadBalance();
    }
  }, [isConnected, address]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (seed.trim()) {
        await connectWallet(seed.trim());
      } else {
        await connectWallet();
      }
      setIsOpen(false);
      setSeed('');
      toast({
        title: 'Wallet Connected',
        description: 'Your XRPL wallet has been connected successfully.',
      });
      await loadBalance();
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setBalance(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your XRPL wallet has been disconnected.',
    });
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard.',
      });
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`https://testnet.xrpl.org/accounts/${address}`, '_blank');
    }
  };

  return (
    <>
      {!isConnected ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            {balance && (
              <span className="text-sm text-muted-foreground">
                {balance} XRP
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect XRPL Wallet</DialogTitle>
            <DialogDescription>
              Connect your XRPL Testnet wallet to make transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="seed">Wallet Seed (Optional)</Label>
              <Input
                id="seed"
                type="password"
                placeholder="Enter seed or leave empty to generate new wallet"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to generate a new wallet for demo purposes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isConnected && address && (
        <Dialog open={false}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wallet Connected</DialogTitle>
              <DialogDescription>Your XRPL wallet is connected</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Address</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={address} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {balance && (
                <div>
                  <Label>Balance</Label>
                  <p className="text-2xl font-bold mt-2">{balance} XRP</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={openExplorer}
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

