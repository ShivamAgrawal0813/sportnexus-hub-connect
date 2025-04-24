import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Discount {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  applicableItems: 'all' | 'equipment' | 'venue' | 'tutorial';
  isActive: boolean;
}

const formSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive('Value must be positive'),
  maxUses: z.coerce.number().positive('Max uses must be positive'),
  expiresAt: z.string().min(1, 'Expiration date is required'),
  minOrderValue: z.coerce.number().optional(),
  maxDiscountAmount: z.coerce.number().optional(),
  applicableItems: z.enum(['all', 'equipment', 'venue', 'tutorial']),
});

const DiscountManager: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 0,
      maxUses: 100,
      expiresAt: '',
      minOrderValue: undefined,
      maxDiscountAmount: undefined,
      applicableItems: 'all',
    },
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  useEffect(() => {
    if (editingDiscount) {
      form.reset({
        code: editingDiscount.code,
        type: editingDiscount.type,
        value: editingDiscount.value,
        maxUses: editingDiscount.maxUses,
        expiresAt: new Date(editingDiscount.expiresAt).toISOString().split('T')[0],
        minOrderValue: editingDiscount.minOrderValue,
        maxDiscountAmount: editingDiscount.maxDiscountAmount,
        applicableItems: editingDiscount.applicableItems,
      });
    } else {
      form.reset({
        code: '',
        type: 'percentage',
        value: 0,
        maxUses: 100,
        expiresAt: '',
        minOrderValue: undefined,
        maxDiscountAmount: undefined,
        applicableItems: 'all',
      });
    }
  }, [editingDiscount, openDialog]);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/discounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDiscounts(data.discounts);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to load discount codes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while fetching discount codes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      const endpoint = editingDiscount
        ? `/api/discounts/${editingDiscount._id}`
        : '/api/discounts';

      const method = editingDiscount ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...values,
          expiresAt: new Date(values.expiresAt),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: editingDiscount ? 'Discount Updated' : 'Discount Created',
          description: `Discount code ${values.code} has been ${
            editingDiscount ? 'updated' : 'created'
          } successfully.`,
          variant: 'default',
        });
        fetchDiscounts();
        setOpenDialog(false);
        setEditingDiscount(null);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save discount code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while saving the discount code',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Discount Deleted',
          description: 'Discount code has been deleted successfully.',
          variant: 'default',
        });
        fetchDiscounts();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete discount code',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the discount code',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discount Codes</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDiscount(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}
              </DialogTitle>
              <DialogDescription>
                {editingDiscount
                  ? 'Update the details of the discount code.'
                  : 'Fill in the details to create a new discount code.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SUMMER20" {...field} />
                      </FormControl>
                      <FormDescription>
                        The code customers will enter to apply the discount.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={
                              form.watch('type') === 'percentage' ? '20' : '10'
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('type') === 'percentage'
                            ? 'Percentage discount (e.g., 20 for 20% off)'
                            : 'Fixed amount discount in currency units'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Uses</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum number of times this code can be used.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="applicableItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicable Items</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select applicable items" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Items</SelectItem>
                          <SelectItem value="equipment">Equipment Only</SelectItem>
                          <SelectItem value="venue">Venues Only</SelectItem>
                          <SelectItem value="tutorial">Tutorials Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Order Value (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50"
                            {...field}
                            value={field.value || ''}
                            onChange={e => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum order value required to use this code.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Discount Amount (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="20"
                            {...field}
                            value={field.value || ''}
                            onChange={e => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum discount amount (for percentage discounts).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {discounts.length > 0 ? (
          discounts.map((discount) => (
            <Card key={discount._id} className={!discount.isActive ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{discount.code}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {discount.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {discount.type === 'percentage'
                    ? `${discount.value}% off`
                    : `$${discount.value} off`}
                  {' on '}
                  {discount.applicableItems === 'all'
                    ? 'all items'
                    : `${discount.applicableItems} only`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span>
                      {discount.currentUses} / {discount.maxUses}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{formatDate(discount.expiresAt)}</span>
                  </div>
                  {discount.minOrderValue && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order:</span>
                      <span>${discount.minOrderValue}</span>
                    </div>
                  )}
                  {discount.maxDiscountAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Discount:</span>
                      <span>${discount.maxDiscountAmount}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex space-x-2 w-full">
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingDiscount(discount)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-500"
                    onClick={() => handleDeleteDiscount(discount._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">
              No discount codes found. Create your first discount code to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountManager; 