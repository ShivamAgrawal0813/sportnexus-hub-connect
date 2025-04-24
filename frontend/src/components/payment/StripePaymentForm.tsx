import React, { useState } from 'react';
import { 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setInternalLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: Number(amount),
        currency: currency.toLowerCase(),
        bookingId,
        discountCode,
        paymentMethod: 'stripe'
      };
      
      console.log('Creating payment intent with data:', paymentData);
      
      // Call your backend to create a payment intent
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData),
      });

      const responseText = await response.text();
      
      console.log('Raw API response:', responseText);
      
      if (!response.ok) {
        console.error('Payment API error:', response.status, response.statusText, responseText);
        throw new Error(`Payment API error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Payment intent created:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment intent');
      }

      // Use the client secret from the payment intent
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Confirming payment with client secret');
      // Confirm the payment with the card details
      const paymentResult = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can add more billing details here if needed
          },
        },
      });

      console.log('Payment result:', paymentResult);

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || 'Payment failed');
      } else if (paymentResult.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: 'Payment Successful',
          description: 'Your payment was processed successfully.',
          variant: 'default',
        });
        onSuccess(paymentResult.paymentIntent);
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'An error occurred while processing payment');
      toast({
        title: 'Payment Failed',
        description: err.message || 'An error occurred while processing payment',
        variant: 'destructive',
      });
      onError(err);
    } finally {
      setInternalLoading(false); // Only reset internal loading state
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
        <div className="text-red-500 text-sm">
          {error}
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