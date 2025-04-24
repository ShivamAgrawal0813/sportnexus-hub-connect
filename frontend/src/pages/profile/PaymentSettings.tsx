import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserWallet from '@/components/payment/UserWallet';
import SubscriptionPlans from '@/components/payment/SubscriptionPlans';

const PaymentSettings: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Payment & Subscriptions</h1>
      
      <Tabs defaultValue="wallet" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallet">My Wallet</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallet" className="space-y-6">
          <UserWallet />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSettings; 