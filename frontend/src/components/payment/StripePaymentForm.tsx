import React, { useState } from 'react';
import { 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  bookingId?: string;
  discountCode?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
  isLoading?: boolean;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  bookingId,
  discountCode,
  onSuccess,
  onError,
  isLoading: externalLoading
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();
  
  // Use either external or internal loading state
  const isLoading = externalLoading || internalLoading;

  // Check if Stripe is properly configured
  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  // If Stripe isn't configured, show a configuration message instead of the form
  if (!isStripeConfigured) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Stripe payment is not configured. Please set up the Stripe environment variables.
          <div className="mt-2">
            <Button 
              variant="outline" 
              onClick={() => onError(new Error("Stripe not configured"))}
            >
              Go Back
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Function to create payment intent
  const createPaymentIntent = async () => {
    const paymentRequestData = {
      amount: Number(amount),
      currency: currency.toLowerCase(),
      bookingId,
      discountCode,
      paymentMethod: 'stripe'
    };
    
    setPaymentData(paymentRequestData);
    
    // Call your backend to create a payment intent
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(paymentRequestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Payment service unavailable';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use generic error message
      }
      
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid response from payment service');
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to create payment intent');
    }
    
    return data;
  };
  
  // Function to confirm card payment
  const confirmCardPayment = async (clientSecret: string) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized');
    }
    
    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      throw new Error('Card information not provided');
    }

    // Confirm the payment with the card details
    const paymentResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          // You can add more billing details here if needed
        },
      },
    });

    if (paymentResult.error) {
      throw new Error(paymentResult.error.message || 'Payment failed');
    } 
    
    if (paymentResult.paymentIntent.status === 'succeeded') {
      return paymentResult.paymentIntent;
    } else {
      throw new Error('Payment not completed');
    }
  };

  // Handle retry logic
  const handleRetry = async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again later or use a different payment method.');
      return;
    }
    
    setInternalLoading(true);
    setError(null);
    setRetryCount(prevCount => prevCount + 1);
    
    try {
      await processPayment();
    } catch (err: any) {
      const userFriendlyError = 'Payment failed. Please verify your card details and try again.';
      setError(userFriendlyError);
      
      toast({
        title: 'Payment Failed',
        description: userFriendlyError,
        variant: 'destructive',
      });
    } finally {
      setInternalLoading(false);
    }
  };
  
  // Process the payment
  const processPayment = async () => {
    try {
      // Create or use existing payment intent
      const data = paymentData ? await createPaymentIntent() : await createPaymentIntent();
      
      // Confirm the payment
      const paymentIntent = await confirmCardPayment(data.clientSecret);
      
      // Payment succeeded
      toast({
        title: 'Payment Successful',
        description: 'Your payment was processed successfully.',
        variant: 'default',
      });
      
      onSuccess(paymentIntent);
      return true;
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setInternalLoading(true);
    setError(null);

    try {
      await processPayment();
    } catch (err: any) {
      // Set a user-friendly error message
      const userFriendlyError = 'Payment failed. Please verify your card details and try again.';
      setError(userFriendlyError);
      
      toast({
        title: 'Payment Failed',
        description: userFriendlyError,
        variant: 'destructive',
      });
      
      // Pass the actual error to the handler for logging
      onError(err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border rounded-md p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm flex items-center justify-between">
          <span>{error}</span>
          {retryCount < 3 && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)}`
        )}
      </Button>
    </form>
  );
};

export default StripePaymentForm; 