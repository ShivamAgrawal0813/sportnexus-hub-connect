import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminBookingCard } from "@/components/admin/AdminBookingCard";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface BookingCounts {
  venues: number;
  equipment: number;
  tutorials: number;
  pendingBookings: number;
  confirmedBookings: number;
  canceledBookings: number;
}

interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  totalPrice: number;
  itemType: 'venue' | 'equipment' | 'tutorial';
  venue?: any;
  equipment?: any[];
  tutorial?: any;
}

interface ItemWithBookings {
  item: any;
  type: 'venue' | 'equipment' | 'tutorial';
  bookings: Booking[];
}

export default function AdminMyBookingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const { user, isAuthenticated } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<{ success: boolean; message: string | null }>({
    success: false,
    message: null,
  });

  // Get token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthToken(token);
    
    if (!token) {
      console.error("No authentication token found");
      toast.error("Authentication required. Please log in again.");
    } else {
      console.log("Token available:", !!token);
      
      // Try to ping the admin API to check if the token is valid
      const pingAdminAPI = async () => {
        try {
          const response = await axios.get(`${API_URL}/admin/ping`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log("Admin API ping response:", response.data);
          setPingStatus({
            success: true,
            message: "Admin API accessible",
          });
        } catch (error: any) {
          console.error("Admin API ping error:", error);
          setPingStatus({
            success: false,
            message: error.response?.data?.message || "Failed to connect to admin API",
          });
        }
      };
      
      pingAdminAPI();
    }
  }, []);
  
  // Fetch admin bookings
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ["adminBookings"],
    queryFn: async () => {
      try {
        // Ensure token is available
        if (!authToken) {
          throw new Error("Authentication required. Please log in again.");
        }

        // Log user role to verify admin status
        console.log("Current user role:", user?.role);
        
        if (user?.role !== 'admin') {
          throw new Error("Admin privileges required");
        }
        
        console.log("Making API request to:", `${API_URL}/admin/bookings`);
        
        const response = await axios.get(`${API_URL}/admin/bookings`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        console.log("API response received:", response.status);
        return response.data;
      } catch (err: any) {
        console.error("Admin bookings fetch error:", err);
        
        // Provide more detailed error message
        if (err.response) {
          // Server responded with an error status code
          console.error("Server response:", err.response.data);
          console.error("Status code:", err.response.status);
          throw new Error(err.response?.data?.message || `Server error: ${err.response.status}`);
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          throw new Error("No response from server. Please check your network connection.");
        } else {
          // Error in setting up the request
          console.error("Request setup error:", err.message);
          throw err;
        }
      }
    },
    enabled: !!authToken && isAuthenticated, // Only run if authenticated
  });

  // Update booking status mutation
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await axios.patch(
        `${API_URL}/admin/booking-status`,
        { bookingId, status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch bookings data
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      toast.success(`Booking status updated to ${data.data.status}`);
    },
    onError: (error: any) => {
      console.error("Status update error:", error);
      toast.error(
        `Failed to update booking status: ${error.response?.data?.message || error.message}`
      );
    },
  });

  // Handle status change
  const handleStatusChange = (bookingId: string, status: string) => {
    try {
      toast.info(`Updating booking status to ${status}...`);
      updateBookingStatus.mutate({ bookingId, status });
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Filter items based on active tab
  const filterItemsByType = (items: ItemWithBookings[] = [], type: string) => {
    if (type === "all") return items;
    return items.filter((item) => item.type === type);
  };

  // Check if there are no items or bookings
  const hasNoData = !isLoading && (!data?.data || data.data.length === 0);
  
  // Get counts
  const counts: BookingCounts = data?.counts || {
    venues: 0,
    equipment: 0,
    tutorials: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    canceledBookings: 0,
  };

  // Add a retry button at the top when ping fails
  const retryConnection = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token available");
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/admin/ping`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setPingStatus({
        success: true,
        message: "Admin API accessible",
      });
      toast.success("Connection restored. Refreshing data...");
      refetch();
    } catch (error: any) {
      setPingStatus({
        success: false,
        message: error.response?.data?.message || "Failed to connect to admin API",
      });
      toast.error("Connection still failed: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Bookings Dashboard</h1>
      
      <AdminNav />
      
      {!pingStatus.success && pingStatus.message && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>{pingStatus.message}</span>
            <Button size="sm" onClick={retryConnection}>Retry Connection</Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Error loading bookings. Please try again later."}
          </AlertDescription>
        </Alert>
      ) : hasNoData ? (
        <div className="bg-muted p-8 rounded-md text-center">
          <h3 className="text-xl font-medium mb-2">No Items Found</h3>
          <p className="text-muted-foreground">
            You don't have any venues, equipment, or tutorials yet.
          </p>
        </div>
      ) : (
        <>
          {/* Booking status counts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold">{counts.pendingBookings}</div>
              <div className="flex items-center mt-1">
                <BookingStatusBadge status="pending" />
                <span className="ml-2">Pending Bookings</span>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold">{counts.confirmedBookings}</div>
              <div className="flex items-center mt-1">
                <BookingStatusBadge status="confirmed" />
                <span className="ml-2">Confirmed Bookings</span>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold">{counts.canceledBookings}</div>
              <div className="flex items-center mt-1">
                <BookingStatusBadge status="canceled" />
                <span className="ml-2">Canceled Bookings</span>
              </div>
            </div>
          </div>
          
          {/* Tabs for filtering by item type */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">
                All Items
                <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {data.data.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="venue">
                Venues
                <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {counts.venues}
                </span>
              </TabsTrigger>
              <TabsTrigger value="equipment">
                Equipment
                <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {counts.equipment}
                </span>
              </TabsTrigger>
              <TabsTrigger value="tutorial">
                Tutorials
                <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {counts.tutorials}
                </span>
              </TabsTrigger>
            </TabsList>
            
            {/* Tab content */}
            <TabsContent value={activeTab} className="space-y-4">
              {filterItemsByType(data.data, activeTab).map((itemData: ItemWithBookings) => (
                <AdminBookingCard
                  key={`${itemData.type}-${itemData.item._id}`}
                  item={itemData.item}
                  type={itemData.type}
                  bookings={itemData.bookings}
                  onStatusChange={handleStatusChange}
                />
              ))}
              
              {/* Show message when no items match the current filter */}
              {filterItemsByType(data.data, activeTab).length === 0 && (
                <div className="bg-muted p-6 rounded-md text-center">
                  <p className="text-muted-foreground">
                    No {activeTab !== "all" ? activeTab : "items"} found.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 