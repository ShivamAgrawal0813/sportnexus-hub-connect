import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2 } from 'lucide-react';
import StripeProvider from './StripeProvider';
import StripePaymentForm from './StripePaymentForm';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

interface Subscription {
  _id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  features: string[];
}

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch plans
      const plansResponse = await fetch('/api/subscriptions/plans');
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        setPlans(plansData.plans);
      }
      
      // Fetch user's subscription if authenticated
      const token = localStorage.getItem('token');
      if (token) {
        const subscriptionResponse = await fetch('/api/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const subscriptionData = await subscriptionResponse.json();
        
        if (subscriptionData.success && subscriptionData.subscription) {
          setSubscription(subscriptionData.subscription);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleCancelSelectPlan = () => {
    setSelectedPlan(null);
  };

  const handleSubscriptionSuccess = async (paymentIntent: any) => {
    try {
      setIsProcessing(true);
      
      // Create subscription in backend
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan: selectedPlan?.id,
          paymentMethod: 'stripe'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Subscription Activated',
          description: `Your ${selectedPlan?.name} subscription has been activated successfully.`,
          variant: 'default',
        });
        setSubscription(data.subscription);
        setSelectedPlan(null);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to activate subscription',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while processing subscription',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscriptionError = (error: any) => {
    setIsProcessing(false);
    toast({
      title: 'Payment Failed',
      description: error.message || 'An error occurred during payment',
      variant: 'destructive',
    });
  };

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Subscription Canceled',
          description: 'Your subscription will be active until the end of the current billing period.',
          variant: 'default',
        });
        
        // Update local subscription data
        setSubscription({
          ...subscription!,
          cancelAtPeriodEnd: true
        } as Subscription);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to cancel subscription',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while canceling subscription',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {subscription && (
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Your Current Subscription</CardTitle>
            <CardDescription>
              {subscription.status === 'active' 
                ? `Active until ${formatDate(subscription.currentPeriodEnd)}`
                : 'Subscription status: ' + subscription.status
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {subscription.plan} Plan
                </h3>
                <ul className="mt-2 space-y-1">
                  {subscription.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedPlan ? (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.id === 'premium' ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.id === 'premium' && (
                    <Badge variant="default">Popular</Badge>
                  )}
                </div>
                <CardDescription>
                  {formatCurrency(plan.price, plan.currency)} / {plan.interval}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 mt-1 mr-2 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.id === 'premium' ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={!!subscription && subscription.plan === plan.id}
                >
                  {!!subscription && subscription.plan === plan.id 
                    ? 'Current Plan'
                    : 'Subscribe'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscribe to {selectedPlan.name} Plan</CardTitle>
            <CardDescription>
              {formatCurrency(selectedPlan.price, selectedPlan.currency)} / {selectedPlan.interval}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                <ul className="space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <StripeProvider>
                <StripePaymentForm
                  amount={selectedPlan.price}
                  currency={selectedPlan.currency}
                  onSuccess={handleSubscriptionSuccess}
                  onError={handleSubscriptionError}
                />
              </StripeProvider>
              
              <Button 
                variant="outline" 
                onClick={handleCancelSelectPlan}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionPlans; 