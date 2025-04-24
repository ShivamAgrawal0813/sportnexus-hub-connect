import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BookingPayment from '@/components/payment/BookingPayment';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function BookingCheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validBooking, setValidBooking] = useState(false);

  // Check if we were redirected from the booking creation
  const isFromBookingCreation = location.state?.fromBookingCreation || false;

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Verify if the booking exists and belongs to the user
    const verifyBooking = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Verifying booking:', bookingId);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to access this page');
          setIsLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Booking verification successful:', response.data);
        setValidBooking(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Booking verification error:', err);
        
        let errorMessage = 'Failed to verify booking';
        if (err.response) {
          if (err.response.status === 403) {
            errorMessage = 'Not authorized to access this booking';
          } else if (err.response.status === 404) {
            errorMessage = 'Booking not found';
          } else {
            errorMessage = err.response.data?.message || `Error ${err.response.status}: ${errorMessage}`;
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    verifyBooking();
  }, [bookingId, toast]);

  const handlePaymentSuccess = () => {
    setIsPaymentComplete(true);
  };

  const handleNavigateToBookings = () => {
    navigate('/bookings');
  };

  const handleNavigateBack = () => {
    if (isFromBookingCreation) {
      navigate('/bookings');
    } else {
      navigate(-1);
    }
  };

  // Show loader while initializing
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if we have an error
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Access Error</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNavigateToBookings} className="w-full mb-2">
              View My Bookings
            </Button>
            <Button onClick={handleNavigateBack} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message after payment is complete
  if (isPaymentComplete) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>
              Your booking has been confirmed and paid for.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleNavigateToBookings} className="w-full">
              View My Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no booking ID is provided, show error
  if (!bookingId) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>
              We couldn't find the booking information you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNavigateBack} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If booking is valid, show payment form
  if (validBooking) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="outline" 
            onClick={handleNavigateBack} 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <BookingPayment 
            bookingId={bookingId} 
            onSuccess={handlePaymentSuccess} 
            onCancel={handleNavigateBack} 
          />
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return (
    <div className="container mx-auto py-12 px-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          Please try again or contact support if the problem persists.
        </AlertDescription>
        <Button onClick={handleNavigateBack} variant="outline" className="mt-2">
          Go Back
        </Button>
      </Alert>
    </div>
  );
} 