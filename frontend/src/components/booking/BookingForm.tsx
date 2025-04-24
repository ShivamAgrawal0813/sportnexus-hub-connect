import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Define the form schema with Zod
const venueBookingSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  notes: z.string().optional(),
});

const equipmentBookingSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  notes: z.string().optional(),
});

interface BookingFormProps {
  itemType: 'venue' | 'equipment';
  itemId: string;
  price: number;
  onSuccess?: () => void;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  redirectToPayment?: boolean;
}

export function BookingForm({ 
  itemType, 
  itemId, 
  price, 
  onSuccess,
  disabledDates = [],
  minDate = new Date(),
  maxDate,
  redirectToPayment = true
}: BookingFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isTimeError, setIsTimeError] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(price);
  
  // Define form schema based on item type
  const formSchema = itemType === 'venue' ? venueBookingSchema : equipmentBookingSchema;
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: ""
    },
  });

  // Setup mutation for creating a booking
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`${API_URL}/bookings`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Booking created",
        description: redirectToPayment 
          ? "Redirecting to payment page..." 
          : "Your booking has been created successfully.",
        variant: "success"
      });
      
      form.reset();
      
      if (redirectToPayment && data._id) {
        // Redirect to the payment page with the booking ID
        navigate(`/bookings/checkout/${data._id}`, { 
          state: { fromBookingCreation: true } 
        });
      } else if (onSuccess) {
        // Just call the success callback (for backward compatibility)
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.response?.data?.message || "An error occurred while creating your booking.",
        variant: "destructive"
      });
    }
  });

  // Time options for venue bookings
  const timeOptions = [];
  for (let hour = 8; hour <= 22; hour++) {
    const hourString = hour.toString().padStart(2, '0');
    timeOptions.push(`${hourString}:00`);
  }

  // Calculate price when start/end time changes
  useEffect(() => {
    if (itemType === 'venue') {
      const startTime = form.watch('startTime');
      const endTime = form.watch('endTime');
      
      if (startTime && endTime) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (endHour > startHour) {
          const duration = endHour - startHour;
          setCalculatedPrice(price * duration);
        }
      }
    } else {
      setCalculatedPrice(price);
    }
  }, [form.watch('startTime'), form.watch('endTime'), itemType, price]);

  // Handle form submission
  const onSubmit = (values: any) => {
    // For venue booking, validate that end time is after start time
    if (itemType === 'venue') {
      const startHour = parseInt(values.startTime.split(':')[0]);
      const endHour = parseInt(values.endTime.split(':')[0]);
      
      if (endHour <= startHour) {
        setIsTimeError(true);
        return;
      } else {
        setIsTimeError(false);
      }
    }

    // Calculate the total price based on duration for venues
    let calculatedPrice = price;
    if (itemType === 'venue' && values.startTime && values.endTime) {
      const startHour = parseInt(values.startTime.split(':')[0]);
      const endHour = parseInt(values.endTime.split(':')[0]);
      const duration = endHour - startHour;
      calculatedPrice = price * duration;
    }

    // Prepare booking data
    const bookingData = {
      itemType,
      itemId,
      date: format(values.date, 'yyyy-MM-dd'),
      subtotalPrice: calculatedPrice, // Add subtotalPrice field
      totalPrice: calculatedPrice     // Add totalPrice field
    };

    // Add time slot for venue bookings
    if (itemType === 'venue' && values.startTime && values.endTime) {
      bookingData.timeSlot = {
        start: values.startTime,
        end: values.endTime
      };
    }

    // Add notes if provided
    if (values.notes) {
      bookingData.notes = values.notes;
    }

    // Log the data we're sending
    console.log('Submitting booking data:', bookingData);

    // Submit the booking
    createBookingMutation.mutate(bookingData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span className="text-muted-foreground">Pick a date</span>
                      )}
                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // Disable dates before today
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // Disable dates that are in the disabled list
                      const isDisabled = disabledDates.some(disabledDate => 
                        disabledDate.toDateString() === date.toDateString()
                      );
                      
                      // Check if date is before min date or after max date
                      const isBefore = date < minDate;
                      const isAfter = maxDate ? date > maxDate : false;
                      
                      return date < today || isDisabled || isBefore || isAfter;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {itemType === 'venue' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Select time</option>
                          {timeOptions.slice(0, -1).map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Select time</option>
                          {timeOptions.slice(1).map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isTimeError && (
              <p className="text-sm font-medium text-destructive">
                End time must be after start time
              </p>
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requirements or notes for the booking"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="border rounded-md p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Price:</span>
            <span className="text-lg font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(calculatedPrice)}
            </span>
          </div>
          {itemType === 'venue' && (
            <p className="text-xs text-muted-foreground mt-1">
              Based on venue rate of ${price.toFixed(2)}/hour
            </p>
          )}
          {itemType === 'equipment' && (
            <p className="text-xs text-muted-foreground mt-1">
              Daily rental rate
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            redirectToPayment ? "Continue to Payment" : "Book Now"
          )}
        </Button>
      </form>
    </Form>
  );
} 