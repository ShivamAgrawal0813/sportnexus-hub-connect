import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BookingStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'canceled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return '';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'canceled':
        return 'Canceled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize", 
        getStatusStyles(), 
        className
      )}
    >
      {getStatusLabel()}
    </Badge>
  );
} 