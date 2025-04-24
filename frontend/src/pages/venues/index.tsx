import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { VenueCard } from "@/components/cards/VenueCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  rating: number;
  [key: string]: any;
}

export default function VenuesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sportTypeFilter, setSportTypeFilter] = useState("all_sports");
  const [cityFilter, setCityFilter] = useState("all_cities");
  
  // Fetch venues with search and filter
  const { data, isLoading, isError } = useQuery({
    queryKey: ["venues", searchQuery, sportTypeFilter, cityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (searchQuery) params.search = searchQuery;
      if (sportTypeFilter && sportTypeFilter !== "all_sports") params.sportType = sportTypeFilter;
      if (cityFilter && cityFilter !== "all_cities") params.city = cityFilter;
      
      const response = await axios.get(`${API_URL}/venues`, { params });
      return response.data;
    },
  });

  // Get unique sport types and cities for filters
  const sportTypes = data?.venues 
    ? [...new Set(data.venues.flatMap((venue: Venue) => venue.sportTypes))]
    : [];
  
  const cities = data?.venues
    ? [...new Set(data.venues.map((venue: Venue) => venue.city))]
    : [];

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Sports Venues</h1>
      
      {/* Search and filters */}
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
          <div className="col-span-2">
            <Input
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={sportTypeFilter}
            onValueChange={setSportTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sport Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_sports">All Sports</SelectItem>
              {sportTypes.map((type: string) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={cityFilter}
            onValueChange={setCityFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_cities">All Cities</SelectItem>
              {cities.map((city: string) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="col-span-full md:col-span-2 md:col-start-3 grid grid-cols-2 gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSportTypeFilter("all_sports");
                setCityFilter("all_cities");
              }}
            >
              Clear Filters
            </Button>
            <Button type="submit">Search</Button>
          </div>
        </form>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="flex justify-center items-center h-64 text-destructive">
          Failed to load venues. Please try again later.
        </div>
      )}
      
      {/* No results */}
      {data?.venues?.length === 0 && (
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          No venues found. Try adjusting your filters.
        </div>
      )}
      
      {/* Venues grid */}
      {data?.venues && data.venues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.venues.map((venue: Venue) => (
            <VenueCard key={venue._id} venue={venue} />
          ))}
        </div>
      )}
      
      {/* Pagination can be added here later */}
    </div>
  );
}
