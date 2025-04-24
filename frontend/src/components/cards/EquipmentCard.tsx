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
import { Tag, Clock, Package, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface EquipmentCardProps {
  equipment: {
    _id: string;
    name: string;
    description: string;
    category: string;
    brand: string;
    model: string;
    images: string[];
    sportType: string;
    condition: string;
    rentalPriceDaily: number;
    availability: string;
    features: string[];
  };
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  // Display first image or placeholder
  const imageUrl = equipment.images && equipment.images.length > 0
    ? equipment.images[0]
    : "https://placehold.co/600x400?text=No+Image";

  // Map condition to badge variant
  const conditionVariant = () => {
    switch (equipment.condition) {
      case 'New': return 'secondary';
      case 'Like New': return 'default';
      case 'Good': return 'outline';
      case 'Fair': return 'destructive';
      case 'Poor': return 'destructive';
      default: return 'outline';
    }
  };

  // Stock badge variant
  const stockVariant = () => {
    switch (equipment.availability) {
      case 'In Stock': return 'secondary';
      case 'Low Stock': return 'default';
      case 'Out of Stock': return 'destructive';
      case 'Discontinued': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={equipment.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={stockVariant()} className="text-white">
            {equipment.availability}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl line-clamp-1">{equipment.name}</CardTitle>
          <div className="flex items-center text-muted-foreground text-sm">
            <Tag className="h-4 w-4 mr-1" />
            <span>{equipment.brand} - {equipment.model}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <CardDescription className="line-clamp-2 mb-3">
          {equipment.description}
        </CardDescription>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline">{equipment.sportType}</Badge>
          <Badge variant="outline">{equipment.category}</Badge>
          <Badge variant={conditionVariant()}>{equipment.condition}</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>${equipment.rentalPriceDaily}/day</span>
          </div>
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{equipment.features.length} features</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link to={`/equipment/${equipment._id}`}>
            <Info className="h-4 w-4 mr-2" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 