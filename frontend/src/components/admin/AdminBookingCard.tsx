import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MapPin, Clock, User, Tag, InfoIcon } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/BookingStatusBadge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminBookingCardProps {
  item: any;
  type: 'venue' | 'equipment' | 'tutorial';
  bookings: any[];
  onStatusChange: (bookingId: string, status: string) => void;
}

export function AdminBookingCard({ item, type, bookings, onStatusChange }: AdminBookingCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get image based on item type
  const getImage = () => {
    if (type === 'venue' && item.images && item.images.length > 0) {
      return item.images[0];
    } else if (type === 'equipment' && item.images && item.images.length > 0) {
      return item.images[0];
    } else if (type === 'tutorial') {
      // Try different possible image properties for tutorials
      if (item.thumbnailUrl) return item.thumbnailUrl;
      if (item.coverImage) return item.coverImage;
      if (item.images && item.images.length > 0) return item.images[0];
    }
    
    return `https://placehold.co/600x400?text=No+Image`;
  };

  // Get type-specific details
  const getTypeSpecificDetails = () => {
    if (type === 'venue') {
      return (
        <>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{item.city}, {item.state}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>${item.pricePerHour}/hr</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Capacity: {item.capacity}</span>
          </div>
        </>
      );
    } else if (type === 'equipment') {
      return (
        <>
          <div className="flex items-center text-sm">
            <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>${item.rentalPriceDaily}/day</span>
          </div>
          <div className="flex items-center text-sm">
            <InfoIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Condition: {item.condition}</span>
          </div>
        </>
      );
    } else if (type === 'tutorial') {
      return (
        <>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Duration: {item.duration} mins</span>
          </div>
          <div className="flex items-center text-sm">
            <InfoIcon className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Level: {item.skillLevel || 'All Levels'}</span>
          </div>
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Sport: {item.sportType}</span>
          </div>
        </>
      );
    }
    
    return null;
  };

  // Get pending bookings count for badge
  const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
  
  // Check if there are any bookings
  const hasBookings = bookings.length > 0;

  // Log bookings info for debugging
  if (type === 'tutorial' && bookings.length > 0) {
    console.log(`Tutorial "${item.title}" bookings:`, bookings);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Badge className="mb-2 capitalize">{type}</Badge>
            <CardTitle className="text-xl">
              {type === 'tutorial' ? item.title : item.name}
            </CardTitle>
            <CardDescription className="line-clamp-1 mt-1">
              {item.description}
            </CardDescription>
          </div>
          <div className="relative h-16 w-16 overflow-hidden rounded-md">
            <img
              src={getImage()}
              alt={type === 'tutorial' ? item.title : item.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {getTypeSpecificDetails()}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            {hasBookings ? (
              <span className="text-orange-500 font-medium">
                {pendingBookings > 0 ? `${pendingBookings} Pending Requests` : "All Processed"}
              </span>
            ) : (
              <span className="text-green-500 font-medium">Available</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {bookings.length > 0 && (
              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    {isOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Bookings
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show Bookings ({bookings.length})
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardFooter className="border-t flex-col items-start pt-4">
                    <h4 className="font-medium mb-2">Booking Requests</h4>
                    <div className="w-full space-y-3">
                      {bookings.map((booking) => (
                        <div 
                          key={booking._id} 
                          className="bg-muted p-3 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center mb-1">
                              <User className="h-4 w-4 mr-1" />
                              <span className="font-medium">{booking.user.name}</span>
                            </div>
                            <div className="text-sm">
                              {format(new Date(booking.date), "PPP")}
                              {booking.timeSlot && (
                                <span> • {booking.timeSlot.start} - {booking.timeSlot.end}</span>
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              <BookingStatusBadge status={booking.status} />
                              <span className="ml-2 text-sm">
                                ${booking.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-2 md:mt-0">
                            {booking.status === "pending" && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => onStatusChange(booking._id, "confirmed")}
                                >
                                  Confirm
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => onStatusChange(booking._id, "canceled")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {booking.status === "confirmed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onStatusChange(booking._id, "completed")}
                              >
                                Mark as Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardFooter>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 