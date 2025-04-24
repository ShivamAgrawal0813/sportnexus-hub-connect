import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import StripeProvider from './StripeProvider';
import StripePaymentForm from './StripePaymentForm';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface BookingPaymentProps {
  bookingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface BookingDetails {
  _id: string;
  itemType: 'venue' | 'equipment';
  venue?: {
    name: string;
    address: string;
    images: string[];
  };
  equipment?: {
    name: string;
    brand: string;
    model: string;
    images: string[];
  }[];
  date: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  totalPrice: number;
  subtotalPrice: number;
  status: string;
  paymentStatus: string;
}

const BookingPayment: React.FC<BookingPaymentProps> = ({ bookingId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wallet'>('stripe');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        console.log('Fetching booking details for ID:', bookingId);
        const token = localStorage.getItem('token');
        console.log('Using auth token:', token ? 'Token exists' : 'No token found');
        
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Booking data received:', response.data);
        setBooking(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching booking details:', err);
        
        // More detailed error message
        let errorMessage = 'Failed to load booking details';
        if (err.response) {
          console.error('Server response:', err.response.status, err.response.data);
          errorMessage = err.response.data?.message || `Error ${err.response.status}: ${errorMessage}`;
        } else if (err.request) {
          console.error('No response received from server');
          errorMessage = 'No response received from server';
        } else {
          console.error('Error setting up request:', err.message);
          errorMessage = err.message || errorMessage;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        // Show toast for additional visibility
        toast({
          title: "Error loading booking",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId, toast]);

  const handlePaymentSuccess = () => {
    // Update the booking status here
    const updateBookingStatus = async () => {
      try {
        console.log('Updating booking status for booking ID:', bookingId);
        await axios.post(
          `${API_URL}/bookings/${bookingId}/payment-success`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        console.log('Booking status updated successfully');
      } catch (err) {
        console.error('Error updating booking status:', err);
      }
    };
    
    // Call the update function
    updateBookingStatus();
    
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed.",
      variant: "default",
    });
    onSuccess();
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    toast({
      title: "Payment Failed",
      description: error.message || "There was an error processing your payment.",
      variant: "destructive",
    });
  };

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      console.log('Processing wallet payment for booking:', bookingId);
      
      // Make actual API call to process wallet payment
      const response = await axios.post(
        `${API_URL}/payments`,
        {
          amount: booking?.totalPrice,
          currency: 'USD',
          bookingId: bookingId,
          paymentMethod: 'wallet'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Wallet payment response:', response.data);
      
      if (response.data.success) {
        // Call success handler to update booking status
        handlePaymentSuccess();
        
        // Show specific wallet payment success message
        toast({
          title: "Wallet Payment Successful",
          description: "Payment completed using your wallet balance.",
          variant: "default",
        });
      } else {
        throw new Error(response.data.message || 'Wallet payment failed');
      }
    } catch (err: any) {
      console.error('Wallet payment error:', err);
      
      let errorMessage = err.response?.data?.message || err.message || 'Wallet payment failed';
      handlePaymentError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setLoading(true);
    setError(null);
    
    // Re-fetch the booking details
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setBooking(response.data);
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to load booking details';
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  };

  const handleViewBookings = () => {
    navigate('/bookings');
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || 'Failed to load booking details'}
        </AlertDescription>
        <div className="mt-4 flex flex-col space-y-2">
          <Button variant="secondary" onClick={handleTryAgain}>
            Try Again
          </Button>
          <Button variant="outline" onClick={handleViewBookings}>
            View My Bookings
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Go Back
          </Button>
        </div>
      </Alert>
    );
  }

  const itemName = booking.itemType === 'venue' 
    ? booking.venue?.name 
    : booking.equipment?.map(e => `${e.brand} ${e.model}`).join(', ');

  const formattedDate = new Date(booking.date).toLocaleDateString();
  const timeSlot = booking.timeSlot 
    ? `${booking.timeSlot.start} - ${booking.timeSlot.end}` 
    : 'Full day';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Booking Payment</CardTitle>
          <CardDescription>
            Please select a payment method to confirm your booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Booking Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span>{itemName}</span>
                
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{booking.itemType}</span>
                
                <span className="text-muted-foreground">Date:</span>
                <span>{formattedDate}</span>
                
                {booking.timeSlot && (
                  <>
                    <span className="text-muted-foreground">Time:</span>
                    <span>{timeSlot}</span>
                  </>
                )}
                
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">
                  ${booking.totalPrice.toFixed(2)}
                </span>
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
              </Button>
            </div>

            <Separator className="my-4" />

            {paymentMethod === 'stripe' ? (
              <StripeProvider>
                <StripePaymentForm
                  amount={booking.totalPrice}
                  currency="USD"
                  bookingId={bookingId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </StripeProvider>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pay using your wallet balance. Your current balance will be checked before completing the transaction.
                </p>
                <Button
                  className="w-full"
                  onClick={handleWalletPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.totalPrice)}`
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BookingPayment; 