import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface VenueCardProps {
  venue: {
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
  };
}

export function VenueCard({ venue }: VenueCardProps) {
  // Display first image or placeholder
  const imageUrl = venue.images && venue.images.length > 0
    ? venue.images[0]
    : "https://placehold.co/600x400?text=No+Image";

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          {venue.rating && (
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              ★ {venue.rating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl line-clamp-1">{venue.name}</CardTitle>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{venue.city}, {venue.state}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <CardDescription className="line-clamp-2 mb-3">
          {venue.description}
        </CardDescription>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {venue.sportTypes.slice(0, 3).map((sport) => (
            <Badge key={sport} variant="outline">
              {sport}
            </Badge>
          ))}
          {venue.sportTypes.length > 3 && (
            <Badge variant="outline">+{venue.sportTypes.length - 3} more</Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>${venue.pricePerHour}/hr</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>Capacity: {venue.capacity}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link to={`/venues/${venue._id}`}>
            <Info className="h-4 w-4 mr-2" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 