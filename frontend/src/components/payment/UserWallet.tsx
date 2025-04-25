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
  type: 'credit' | 'debit' | 'conversion';
  description: string;
  reference?: string;
  createdAt: Date;
  metadata?: {
    originalCurrency?: string;
    originalAmount?: number;
  };
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
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [isChangingCurrency, setIsChangingCurrency] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set INR as the default currency if none is set
    if (!localStorage.getItem('preferredCurrency')) {
      localStorage.setItem('preferredCurrency', 'INR');
    }
    
    fetchWallet();
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing wallet data...');
      refreshWallet();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Set initial currency preference from wallet when it loads
  useEffect(() => {
    if (wallet?.currency) {
      // Only update if currency is different to avoid infinite loop
      if (localStorage.getItem('preferredCurrency') !== wallet.currency) {
        localStorage.setItem('preferredCurrency', wallet.currency);
        setSelectedCurrency(wallet.currency);
      }
    }
  }, [wallet?.currency]);

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
    // Get user's location/region preference - for simplicity we're using 'INR' directly
    // In a production app, you might determine this from user settings or browser locale
    const preferredCurrency = localStorage.getItem('preferredCurrency') || 'INR';

    const response = await fetch(`${API_URL}/wallet?preferredCurrency=${preferredCurrency}`, {
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
          paymentIntentId: paymentIntent.id,
          currency: selectedCurrency
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
    setSelectedCurrency(wallet?.currency || 'USD'); // Default to wallet currency
  };

  const handleCancelAddFunds = () => {
    setShowAddFunds(false);
    setFundAmount('');
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyOptions = {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    if (currency === 'INR') {
      // Format INR with Indian locale and ₹ symbol
      return new Intl.NumberFormat('en-IN', currencyOptions).format(amount);
    } else {
      // Format USD with US locale and $ symbol
      return new Intl.NumberFormat('en-US', currencyOptions).format(amount);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleCurrencyChange = async (currency: string) => {
    // Prevent rapid currency switching
    if (isChangingCurrency) {
      toast({
        title: 'Please Wait',
        description: 'A currency conversion is already in progress.',
        variant: 'default',
      });
      return;
    }
    
    // Prevent switching to the same currency
    if (wallet?.currency === currency) {
      toast({
        title: 'No Change Needed',
        description: `Your wallet is already using ${currency}.`,
        variant: 'default',
      });
      return;
    }
    
    setIsChangingCurrency(true);
    setSelectedCurrency(currency);
    localStorage.setItem('preferredCurrency', currency);
    
    // Show explanation of currency conversion
    toast({
      title: 'Converting Currency',
      description: 'Converting your wallet balance to ' + currency + '. Your exact balance value is preserved when switching between currencies.',
      variant: 'default',
    });
    
    // Direct update of the wallet's currency to provide immediate feedback in the UI
    if (wallet) {
      const updatedWallet = {...wallet, currency};
      setWallet(updatedWallet);
    }
    
    // Update the wallet currency on the server
    try {
      const response = await fetch(`${API_URL}/wallet/currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ currency })
      });
      
      if (response.status === 429) {
        // Rate limited
        toast({
          title: 'Too Many Conversions',
          description: 'Please wait a moment before converting currency again.',
          variant: 'destructive',
        });
        // Refresh to get current state
        refreshWallet();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWallet(data.wallet);
        toast({
          title: 'Currency Updated',
          description: `Your wallet currency has been updated to ${currency}`,
          variant: 'default',
        });
      } else {
        throw new Error(data.message || 'Failed to update wallet currency');
      }
    } catch (error) {
      console.error("Failed to update wallet currency:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update wallet currency',
        variant: 'destructive',
      });
      
      // Refresh wallet to ensure display is in sync with server
      refreshWallet();
    } finally {
      setIsChangingCurrency(false);
    }
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
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-primary-foreground/70">
                  Currency: {wallet.currency === 'INR' ? '₹ Indian Rupee' : '$ US Dollar'}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newCurrency = wallet.currency === 'USD' ? 'INR' : 'USD';
                    handleCurrencyChange(newCurrency);
                  }}
                  disabled={isChangingCurrency}
                  className="text-xs"
                >
                  {isChangingCurrency ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>Convert to {wallet.currency === 'USD' ? 'INR ₹' : 'USD $'}</>
                  )}
                </Button>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select 
                        id="currency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedCurrency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    
                    <StripeProvider>
                      <StripePaymentForm
                        amount={Number(fundAmount) || 0}
                        currency={selectedCurrency.toLowerCase()}
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
              
              <TabsContent value="transactions" className="mt-4">
                {wallet.transactions && wallet.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {wallet.transactions.map((transaction, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 border rounded-md ${transaction.type === 'conversion' ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          {transaction.type === 'credit' ? (
                            <ArrowDown className="h-5 w-5 text-green-500" />
                          ) : transaction.type === 'debit' ? (
                            <ArrowRight className="h-5 w-5 text-red-500" />
                          ) : (
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'conversion' && transaction.description.includes('→')
                                ? (() => {
                                    // Parse conversion description which has format "Currency converted: X USD → Y INR"
                                    const parts = transaction.description.split('→');
                                    if (parts.length === 2) {
                                      const fromPart = parts[0].trim().replace('Currency converted: ', '');
                                      const toPart = parts[1].trim();
                                      return (
                                        <span>
                                          Currency converted from <span className="font-semibold">{fromPart}</span> to <span className="font-semibold">{toPart}</span>
                                        </span>
                                      );
                                    }
                                    return transaction.description;
                                  })()
                                : transaction.type === 'conversion'
                                  ? (() => {
                                      // Handle old format "Currency converted from X USD to Y INR"
                                      const match = transaction.description.match(/Currency converted from (\d+\.\d+) ([A-Z]+) to (\d+\.\d+) ([A-Z]+)/);
                                      if (match) {
                                        const [_, fromAmount, fromCurrency, toAmount, toCurrency] = match;
                                        return (
                                          <span>
                                            Currency converted from <span className="font-semibold">{fromAmount} {fromCurrency}</span> to <span className="font-semibold">{toAmount} {toCurrency}</span>
                                          </span>
                                        );
                                      }
                                      return transaction.description;
                                    })()
                                : transaction.description.includes('Payment for booking')
                                  ? (() => {
                                      // Format booking payment descriptions to highlight the booking ID
                                      const match = transaction.description.match(/Payment for booking ([a-f0-9]+)/i);
                                      if (match) {
                                        return (
                                          <span>
                                            Payment for booking <span className="font-semibold">{match[1].substring(0, 8)}...</span>
                                          </span>
                                        );
                                      }
                                      return transaction.description;
                                    })()
                                : transaction.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transaction.createdAt.toString())}
                            </div>
                          </div>
                        </div>
                        <div className={`font-medium ${
                          transaction.type === 'credit' 
                            ? 'text-green-500' 
                            : transaction.type === 'debit' 
                              ? 'text-red-500' 
                              : 'text-blue-500'}`}>
                          {transaction.type === 'conversion' 
                            ? 'Currency Conversion' 
                            : (() => {
                                // Use original currency & amount if available in metadata
                                if (transaction.metadata?.originalCurrency && transaction.metadata?.originalAmount) {
                                  return (transaction.type === 'credit' ? '+' : '-') + 
                                    formatCurrency(
                                      transaction.metadata.originalAmount, 
                                      transaction.metadata.originalCurrency
                                    );
                                }
                                // Otherwise use current wallet currency
                                return (transaction.type === 'credit' ? '+' : '-') + 
                                  formatCurrency(transaction.amount, wallet.currency);
                              })()
                          }
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
            </Tabs>
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