import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Loader2, CreditCard, Wallet, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Note: This is a simplified payment implementation for development purposes.
 * 
 * For a real credit card implementation, you would need to:
 * 1. Add Stripe Elements to collect card details securely
 * 2. Create a payment intent on the server
 * 3. Confirm the payment using the collected card details
 * 4. Handle 3D Secure authentication if required
 * 
 * Example implementation:
 * https://stripe.com/docs/payments/accept-a-payment?platform=web
 */

interface TutorialPaymentProps {
  tutorialId: string;
  tutorialTitle: string;
  price: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TutorialDetails {
  _id: string;
  title: string;
  price: number;
  tutorialType: 'Free' | 'Premium';
}

const TutorialPayment: React.FC<TutorialPaymentProps> = ({
  tutorialId,
  tutorialTitle,
  price,
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wallet'>('wallet');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'INR'>('USD');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);

  // Exchange rates
  const USD_TO_INR = 83.0;
  const INR_TO_USD = 1 / 83.0;

  useEffect(() => {
    // Fetch wallet info when component mounts
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setWalletBalance(response.data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch wallet info:', err);
    }
  };

  const handlePaymentSuccess = () => {
    // Invalidate tutorial query to refresh data
    queryClient.invalidateQueries({ queryKey: ['tutorial', tutorialId] });
    
    // Also invalidate enrolled tutorials list if it exists
    queryClient.invalidateQueries({ queryKey: ['enrolledTutorials'] });
    
    // Call success handler passed from parent
    onSuccess();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Helper to convert between currencies
  const convertPrice = (price: number, fromCurrency: string = 'USD', toCurrency: string = 'USD'): number => {
    if (fromCurrency === toCurrency) {
      return price;
    }
    
    if (fromCurrency === 'USD' && toCurrency === 'INR') {
      return Math.round(price * USD_TO_INR * 100) / 100;
    } else if (fromCurrency === 'INR' && toCurrency === 'USD') {
      return Math.round(price * INR_TO_USD * 100) / 100;
    }
    
    return price;
  };

  // Get the price in the selected currency
  const getPriceInSelectedCurrency = (): number => {
    // Tutorial prices are stored in USD by default
    return convertPrice(price, 'USD', selectedCurrency);
  };

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      
      // Make API call to process wallet payment for the tutorial
      const response = await axios.post(
        `${API_URL}/tutorials/${tutorialId}/payment`,
        {
          paymentMethod: 'wallet',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data) {
        // Call success handler
        handlePaymentSuccess();
        
        // Show success message
        toast.success(`Successfully purchased tutorial using your wallet balance.`);
      } else {
        throw new Error('Wallet payment failed');
      }
    } catch (err: any) {
      console.error('Wallet payment error:', err);
      
      // Check if it's an insufficient funds error
      if (err.response?.data?.currentBalance !== undefined) {
        setShowInsufficientFunds(true);
        toast.error('Insufficient funds in your wallet');
      } else {
        // Get the error message from the response if available
        const errorMessage = err.response?.data?.message || err.message || 'Wallet payment failed';
        setError(errorMessage);
        setShowInsufficientFunds(false);
        
        // Show error toast
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      setLoading(true);
      
      // In a real app with proper Stripe integration, we would:
      // 1. Collect card details using Stripe Elements
      // 2. Create a payment method or token using Stripe.js
      // 3. Pass that token to the backend
      
      // For this demonstration, we'll use a test token
      // This is just for demonstration - in a real app, NEVER hardcode tokens
      const simulatedStripeToken = "tok_visa"; // Stripe test token for a successful payment
      
      // Make API call to process card payment
      const response = await axios.post(
        `${API_URL}/tutorials/${tutorialId}/payment`,
        {
          paymentMethod: 'card',
          stripeToken: simulatedStripeToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data) {
        // Call success handler
        handlePaymentSuccess();
        
        // Show success message
        toast.success(`Successfully purchased tutorial using your card.`);
      } else {
        throw new Error('Card payment failed');
      }
    } catch (err: any) {
      console.error('Card payment error:', err);
      
      // Get the error message from the response if available
      const errorMessage = err.response?.data?.message || err.message || 'Card payment failed';
      setError(errorMessage);
      setShowInsufficientFunds(false);
      
      // Show error toast
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'wallet') {
      handleWalletPayment();
    } else {
      handleCardPayment();
    }
  };

  const handleAddFunds = () => {
    navigate('/profile/wallet');
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex flex-col space-y-2">
          <Button variant="secondary" onClick={() => setError(null)}>
            Try Again
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>
            Please select a payment method to purchase this tutorial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Purchase Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Tutorial:</span>
                <span>{tutorialTitle}</span>
                
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">
                  {formatPrice(getPriceInSelectedCurrency(), selectedCurrency)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                  onClick={() => setSelectedCurrency('USD')}
                  className="flex-1"
                >
                  USD ($)
                </Button>
                <Button
                  type="button"
                  variant={selectedCurrency === 'INR' ? 'default' : 'outline'}
                  onClick={() => setSelectedCurrency('INR')}
                  className="flex-1"
                >
                  INR (₹)
                </Button>
              </div>
            </div>

            <div className="flex space-x-2 mb-4">
              <Button
                variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('stripe')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Credit Card
              </Button>
              <Button
                variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('wallet')}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Wallet
                {walletBalance !== null && (
                  <span className="ml-1 text-xs">
                    ({formatPrice(walletBalance, 'USD')})
                  </span>
                )}
              </Button>
            </div>

            {showInsufficientFunds && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Insufficient Funds</AlertTitle>
                <AlertDescription>
                  You don't have enough balance in your wallet to complete this purchase.
                </AlertDescription>
                <div className="mt-4">
                  <Button onClick={handleAddFunds}>
                    Add Funds to Wallet
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatPrice(getPriceInSelectedCurrency(), selectedCurrency)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TutorialPayment; 