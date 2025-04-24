import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, ArrowDown, ArrowRight, RefreshCw } from 'lucide-react';
import StripeProvider from './StripeProvider';
import StripePaymentForm from './StripePaymentForm';
import { API_URL } from '@/lib/constants';

interface WalletTransaction {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference?: string;
  createdAt: Date;
}

interface Wallet {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

const UserWallet: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWallet();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing wallet data...');
      refreshWallet();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await refreshWalletData();
    } catch (error) {
      console.error('Wallet fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching wallet data';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshWallet = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      await refreshWalletData();
      
      // Optional: Show toast for successful refresh
      toast({
        title: 'Wallet Updated',
        description: 'Your wallet information has been refreshed',
        variant: 'default',
      });
    } catch (error) {
      console.error('Wallet refresh error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while refreshing wallet data';
      toast({
        title: 'Refresh Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const refreshWalletData = async () => {
    const response = await fetch(`${API_URL}/wallet`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      setWallet(data.wallet);
    } else {
      throw new Error(data.message || 'Failed to load wallet');
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsAddingFunds(true);
      // Process the wallet funding after payment
      const response = await fetch(`${API_URL}/wallet/funds/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Funds Added',
          description: 'Funds have been added to your wallet successfully',
          variant: 'default',
        });
        setWallet(data.wallet);
        setShowAddFunds(false);
        setFundAmount('');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to add funds to wallet',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing wallet funding';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handlePaymentError = (error: any) => {
    setIsAddingFunds(false);
    toast({
      title: 'Payment Failed',
      description: error.message || 'An error occurred during payment',
      variant: 'destructive',
    });
  };

  const handleShowAddFunds = () => {
    setShowAddFunds(true);
    setFundAmount('10.00'); // Set a default starting amount
  };

  const handleCancelAddFunds = () => {
    setShowAddFunds(false);
    setFundAmount('');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>My Wallet</CardTitle>
            <CardDescription>Manage your funds and transactions</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshWallet} 
            disabled={isRefreshing}
            title="Refresh wallet"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center p-6 space-y-4">
            <div className="text-destructive font-medium">{error}</div>
            <Button onClick={fetchWallet}>Try Again</Button>
          </div>
        ) : wallet ? (
          <div className="space-y-6">
            <div className="bg-primary/10 p-6 rounded-lg relative">
              {isRefreshing && (
                <div className="absolute top-2 right-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <div className="text-sm font-medium text-primary-foreground/70">Available Balance</div>
              <div className="text-3xl font-bold text-primary-foreground mt-1">
                {formatCurrency(wallet.balance, wallet.currency)}
              </div>
            </div>
            
            <Tabs defaultValue="balance" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="balance">Balance</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="balance" className="space-y-4">
                {showAddFunds ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fundAmount">Amount to Add</Label>
                      <Input
                        id="fundAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    
                    <StripeProvider>
                      <StripePaymentForm
                        amount={Number(fundAmount) || 0}
                        currency={wallet?.currency?.toLowerCase() || 'usd'}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        isLoading={isAddingFunds}
                      />
                    </StripeProvider>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleCancelAddFunds}
                      disabled={isAddingFunds}
                      className="mt-2"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleShowAddFunds} 
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Funds
                  </Button>
                )}
              </TabsContent>
            </Tabs>
            
            <TabsContent value="transactions" className="mt-4">
              {wallet.transactions && wallet.transactions.length > 0 ? (
                <div className="space-y-4">
                  {wallet.transactions.map((transaction, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        {transaction.type === 'credit' ? (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowRight className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt.toString())}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount, wallet.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </TabsContent>
          </div>
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            Unable to load wallet information
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserWallet; 