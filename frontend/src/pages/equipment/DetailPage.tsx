import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Loader2, 
  Tag, 
  DollarSign, 
  Calendar,
  Bookmark,
  ShoppingBag,
  Activity,
  Check,
  Clock,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import ReviewList from '@/components/reviews/ReviewList';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Equipment {
  _id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  images: string[];
  sportType: string;
  condition: string;
  purchasePrice: number;
  rentalPriceDaily: number;
  availability: string;
  quantity: number;
  specifications: Record<string, any>;
  features: string[];
  warranty: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bookingOpen, setBookingOpen] = useState(false);
  
  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/equipment/${id}`);
      return response.data;
    },
  });

  // Fetch existing bookings to disable dates
  const { data: bookingsData } = useQuery({
    queryKey: ["equipment-bookings", id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/bookings?itemType=equipment&itemId=${id}`, {
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

  // Map condition to badge variant
  const conditionVariant = (condition: string) => {
    switch (condition) {
      case 'New': return 'secondary';
      case 'Like New': return 'default';
      case 'Good': return 'outline';
      case 'Fair': return 'destructive';
      case 'Poor': return 'destructive';
      default: return 'outline';
    }
  };

  // Stock badge variant
  const stockVariant = (availability: string) => {
    switch (availability) {
      case 'In Stock': return 'secondary';
      case 'Low Stock': return 'default';
      case 'Out of Stock': return 'destructive';
      case 'Discontinued': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <EquipmentDetailSkeleton />;
  }

  if (isError || !equipment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load equipment</h2>
          <p>We couldn't find the equipment you're looking for. Please try again later.</p>
        </div>
      </div>
    );
  }

  const isBookable = equipment.availability === "In Stock" || equipment.availability === "Low Stock";

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Equipment Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-2">{equipment.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <Tag className="h-4 w-4 mr-1" />
            <span>{equipment.brand} - {equipment.model}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{equipment.sportType}</Badge>
            <Badge variant="outline">{equipment.category}</Badge>
            <Badge variant={conditionVariant(equipment.condition)}>{equipment.condition}</Badge>
            <Badge variant={stockVariant(equipment.availability)} className="text-white">
              {equipment.availability}
            </Badge>
          </div>
        </div>

        <div className="md:w-1/3 flex flex-col justify-between">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-2xl font-bold">${equipment.rentalPriceDaily}<span className="text-base font-normal text-muted-foreground">/day</span></p>
                <p className="text-sm text-muted-foreground">Purchase: ${equipment.purchasePrice}</p>
              </div>
              <Badge variant={stockVariant(equipment.availability)} className="text-white">
                {equipment.availability}
              </Badge>
            </div>
            
            <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
              <SheetTrigger asChild>
                <Button 
                  className="w-full mb-2" 
                  size="lg" 
                  disabled={!isBookable}
                >
                  <Calendar className="h-4 w-4 mr-2" /> Rent Now
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Rent {equipment.name}</SheetTitle>
                  <SheetDescription>
                    Fill out the form below to rent this equipment.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-4">
                  <BookingForm 
                    itemType="equipment" 
                    itemId={equipment._id} 
                    price={equipment.rentalPriceDaily}
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
            
            <Button variant="outline" className="w-full" size="lg">
              <Bookmark className="h-4 w-4 mr-2" /> Save for Later
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {equipment.images && equipment.images.length > 0 ? (
            equipment.images.map((image, index) => (
              <div key={index} className="aspect-video rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${equipment.name} - image ${index + 1}`} 
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
        <h2 className="text-xl font-semibold mb-4">About this equipment</h2>
        <p className="whitespace-pre-line text-muted-foreground">{equipment.description}</p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Features */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          {equipment.features && equipment.features.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2">
              {equipment.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-4 w-4 mr-2 text-primary mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No features listed</p>
          )}
        </div>

        {/* Specifications */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          {equipment.specifications && Object.keys(equipment.specifications).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(equipment.specifications).map(([key, value]) => (
                <li key={key} className="flex flex-col">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground">{String(value)}</span>
                  <Separator className="mt-2" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No specifications listed</p>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Rental Period</h3>
            </div>
            <p className="text-muted-foreground">Minimum 1 day, return by 6 PM on the due date.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Pickup & Return</h3>
            </div>
            <p className="text-muted-foreground">Available for pickup at our main location or delivered for an additional fee.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              <h3 className="font-semibold">Usage Guidelines</h3>
            </div>
            <p className="text-muted-foreground">For recreational use only. Damage may result in additional charges.</p>
          </CardContent>
        </Card>
      </div>

      {/* Warranty section */}
      {equipment.warranty && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Warranty</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-semibold">Warranty Information</h3>
              </div>
              <p className="text-muted-foreground">{equipment.warranty}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <ReviewList
          type="equipment"
          itemId={equipment._id}
          itemName={equipment.name}
        />
      </div>
    </div>
  );
}

function EquipmentDetailSkeleton() {
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
        </div>

        <div className="md:w-1/3">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-full mb-2" />
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

      <h2 className="text-xl font-semibold mb-4">About this equipment</h2>
      <Skeleton className="h-24 w-full mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Specifications</h2>
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      <Loader2 className="animate-spin h-8 w-8 mx-auto my-16 text-primary" />
    </div>
  );
} 