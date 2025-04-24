import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon, CalendarClock, Settings } from "lucide-react";

export function AdminNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isActive = (path: string) => {
    return currentPath === path;
  };
  
  return (
    <div className="flex items-center space-x-2 mb-6 flex-wrap gap-y-2">
      <Button 
        variant={isActive("/admin") ? "default" : "outline"} 
        size="sm" 
        asChild
      >
        <Link to="/admin">
          <HomeIcon className="h-4 w-4 mr-2" />
          Dashboard
        </Link>
      </Button>
      
      <Button 
        variant={isActive("/admin/my-bookings") ? "default" : "outline"} 
        size="sm" 
        asChild
      >
        <Link to="/admin/my-bookings">
          <CalendarClock className="h-4 w-4 mr-2" />
          My Bookings
        </Link>
      </Button>
      
      <Button 
        variant={isActive("/admin/settings") ? "default" : "outline"} 
        size="sm" 
        asChild
      >
        <Link to="/admin/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </Button>
    </div>
  );
} 