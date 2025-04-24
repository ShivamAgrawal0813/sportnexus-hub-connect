import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X } from 'lucide-react';

interface DiscountCodeProps {
  amount: number;
  currency: string;
  itemType?: 'equipment' | 'venue' | 'tutorial';
  onApplyDiscount: (discountInfo: {
    code: string;
    discountedAmount: number;
    discountValue: number;
  }) => void;
}

const DiscountCode: React.FC<DiscountCodeProps> = ({
  amount,
  currency,
  itemType,
  onApplyDiscount,
}) => {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApplyDiscount = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code,
          amount,
          itemType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsApplied(true);
        toast({
          title: 'Discount Applied',
          description: `Discount of ${formatCurrency(data.discountValue, currency)} applied successfully.`,
          variant: 'default',
        });
        onApplyDiscount({
          code,
          discountedAmount: data.discountedAmount,
          discountValue: data.discountValue,
        });
      } else {
        setError(data.message || 'Invalid discount code');
        toast({
          title: 'Error',
          description: data.message || 'Invalid discount code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setError('An error occurred while validating the discount code');
      toast({
        title: 'Error',
        description: 'An error occurred while validating the discount code',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveDiscount = () => {
    setIsApplied(false);
    setCode('');
    onApplyDiscount({
      code: '',
      discountedAmount: amount,
      discountValue: 0,
    });
    toast({
      title: 'Discount Removed',
      description: 'Discount code has been removed.',
      variant: 'default',
    });
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="discountCode">Discount Code</Label>
      <div className="flex space-x-2">
        <Input
          id="discountCode"
          placeholder="Enter discount code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isApplied || isApplying}
          className="flex-1"
        />
        {!isApplied ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyDiscount}
            disabled={isApplying || !code.trim()}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveDiscount}
            className="text-red-500"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm flex items-center">
          <X className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {isApplied && (
        <div className="text-green-500 text-sm flex items-center">
          <Check className="h-4 w-4 mr-1" />
          Discount code applied successfully!
        </div>
      )}
    </div>
  );
};

export default DiscountCode; 