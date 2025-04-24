import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, MapPin, Clock, Users, Tag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import { BookingForm } from "@/components/booking/BookingForm";
import ReviewList from "@/components/reviews/ReviewList";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Venue {
  _id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  sportTypes: string[];
  pricePerHour: number;
  capacity: number;
  images: string[];
  rating?: number;
  address?: string;
  amenities?: string[];
  openingHours?: {
    days: string;
    hours: string;
  }[];
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bookingOpen, setBookingOpen] = useState(false);
  
  const { data: venue, isLoading, isError } = useQuery({
    queryKey: ["venue", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/venues/${id}`);
      return response.data;
    },
  });

  // Fetch existing bookings to disable dates
  const { data: bookingsData } = useQuery({
    queryKey: ["venue-bookings", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/bookings?itemType=venue&itemId=${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    },
    enabled: !!id && !!localStorage.getItem('token'),
  });

  // Extract booked dates
  const bookedDates = bookingsData?.bookings?.map((booking: any) => new Date(booking.date)) || [];

  if (isLoading) {
    return <VenueDetailSkeleton />;
  }

  if (isError || !venue) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load venue</h2>
          <p>We couldn't find the venue you're looking for. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Venue Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{venue.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{venue.city}, {venue.state}</span>
            {venue.address && <span className="ml-1">- {venue.address}</span>}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {venue.sportTypes.map((sport) => (
              <Badge key={sport} variant="outline">
                {sport}
              </Badge>
            ))}
          </div>

          {venue.rating && (
            <div className="flex items-center mb-4">
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                ★ {venue.rating.toFixed(1)}
              </Badge>
            </div>
          )}
        </div>

        <div className="md:w-1/3 flex flex-col justify-between">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <p className="text-2xl font-bold mb-2">${venue.pricePerHour}<span className="text-base font-normal text-muted-foreground">/hour</span></p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>Up to {venue.capacity} people</span>
              </div>
            </div>
            <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
              <SheetTrigger asChild>
                <Button className="w-full" size="lg">
                  <Calendar className="h-4 w-4 mr-2" /> Book Now
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Book {venue.name}</SheetTitle>
                  <SheetDescription>
                    Fill out the form below to book this venue.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-4">
                  <BookingForm 
                    itemType="venue" 
                    itemId={venue._id} 
                    price={venue.pricePerHour}
                    disabledDates={bookedDates}
                    onSuccess={() => setBookingOpen(false)}
                  />
                </div>
                
                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {venue.images && venue.images.length > 0 ? (
            venue.images.map((image, index) => (
              <div key={index} className="aspect-video rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${venue.name} - image ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">No images available</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">About this venue</h2>
        <p className="whitespace-pre-line text-muted-foreground">{venue.description}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Amenities */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Amenities</h2>
          {venue.amenities && venue.amenities.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2">
              {venue.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-primary" />
                  <span>{amenity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No amenities listed</p>
          )}
        </div>

        {/* Opening Hours */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
          {venue.openingHours && venue.openingHours.length > 0 ? (
            <ul className="space-y-2">
              {venue.openingHours.map((hours, index) => (
                <li key={index} className="flex">
                  <Clock className="h-4 w-4 mr-2 text-primary mt-1" />
                  <div>
                    <span className="font-medium">{hours.days}: </span>
                    <span className="text-muted-foreground">{hours.hours}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No opening hours listed</p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <ReviewList 
          type="venue"
          itemId={id || ''}
          itemName={venue.name}
        />
      </div>
    </div>
  );
}

function VenueDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-2/3">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-40 mb-4" />
          
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>

          <Skeleton className="h-6 w-16 mb-4" />
        </div>

        <div className="md:w-1/3">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Gallery</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="aspect-video rounded-lg" />
      </div>

      <h2 className="text-xl font-semibold mb-4">About this venue</h2>
      <Skeleton className="h-24 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Amenities</h2>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Opening Hours</h2>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </div>

      <Loader2 className="animate-spin h-8 w-8 mx-auto my-16 text-primary" />
    </div>
  );
} 