import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { 
  Loader2, 
  Clock, 
  MapPin, 
  Tag, 
  MoreHorizontal,
  Calendar,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Booking {
  _id: string;
  itemType: 'venue' | 'equipment';
  venue?: {
    _id: string;
    name: string;
    city: string;
    state: string;
    images: string[];
  };
  equipment?: {
    _id: string;
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
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export default function BookingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [itemTypeFilter, setItemTypeFilter] = useState("all_types");
  
  // Fetch user's bookings
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", activeTab, itemTypeFilter],
    queryFn: async () => {
      let url = `${API_URL}/bookings?`;
      
      // Add status filter if not "all"
      if (activeTab !== "all") {
        url += `status=${activeTab}&`;
      }
      
      // Add item type filter if not "all_types"
      if (itemTypeFilter !== "all_types") {
        url += `itemType=${itemTypeFilter}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await axios.patch(
        `${API_URL}/bookings/${bookingId}/status`,
        { status: 'canceled' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Booking canceled",
        description: "Your booking has been canceled successfully.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: any) => {
      console.error('Cancel booking error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel booking.",
        variant: "destructive"
      });
    }
  });

  // Status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format booking date and time
  const formatBookingTime = (booking: Booking) => {
    // Format date
    const formattedDate = format(new Date(booking.date), "MMM d, yyyy");
    
    // Add time slot if available (for venues)
    if (booking.timeSlot) {
      return `${formattedDate} · ${booking.timeSlot.start} - ${booking.timeSlot.end}`;
    }
    
    return formattedDate;
  };

  // Get primary image for item
  const getItemImage = (booking: Booking) => {
    if (booking.itemType === 'venue' && booking.venue?.images?.length) {
      return booking.venue.images[0];
    } else if (booking.itemType === 'equipment' && booking.equipment?.[0]?.images?.length) {
      return booking.equipment[0].images[0];
    }
    return "https://placehold.co/600x400?text=No+Image";
  };

  // Get item name
  const getItemName = (booking: Booking) => {
    if (booking.itemType === 'venue' && booking.venue) {
      return booking.venue.name;
    } else if (booking.itemType === 'equipment' && booking.equipment?.length) {
      // For multiple equipment, show first item + count
      const firstItem = booking.equipment[0];
      const totalItems = booking.equipment.length;
      return totalItems > 1 
        ? `${firstItem.name} + ${totalItems - 1} more` 
        : firstItem.name;
    }
    return "Unknown item";
  };

  // Get item location/details
  const getItemDetails = (booking: Booking) => {
    if (booking.itemType === 'venue' && booking.venue) {
      return `${booking.venue.city}, ${booking.venue.state}`;
    } else if (booking.itemType === 'equipment' && booking.equipment?.length) {
      const firstItem = booking.equipment[0];
      return `${firstItem.brand} ${firstItem.model}`;
    }
    return "";
  };

  // Handle cancellation
  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading bookings</h2>
          <p>Failed to load your bookings. Please try again later.</p>
        </div>
      </div>
    );
  }

  const bookings = data?.bookings || [];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        
        <div className="flex items-center gap-2">
          <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">All Types</SelectItem>
              <SelectItem value="venue">Venues</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
                {activeTab === "all" 
                  ? "You haven't made any bookings yet." 
                  : `You don't have any ${activeTab} bookings.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking: Booking) => (
                <Card key={booking._id} className="overflow-hidden flex flex-col h-full">
                  <div className="relative h-40 w-full overflow-hidden">
                    <img 
                      src={getItemImage(booking)} 
                      alt={getItemName(booking)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        {booking.itemType === 'venue' ? 'Venue' : 'Equipment'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">
                        {getItemName(booking)}
                      </CardTitle>
                      {booking.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleCancelBooking(booking._id)}
                            >
                              <X className="h-4 w-4 mr-2" /> Cancel Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4 flex-grow">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        {booking.itemType === 'venue' ? (
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        ) : (
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {getItemDetails(booking)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatBookingTime(booking)}
                        </span>
                      </div>

                      <Separator />
                      
                      <div className="flex justify-between pt-1">
                        <span className="text-sm">Total Amount</span>
                        <span className="font-medium">${booking.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 