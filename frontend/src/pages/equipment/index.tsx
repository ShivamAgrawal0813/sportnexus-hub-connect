import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { EquipmentCard } from "@/components/cards/EquipmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  [key: string]: any;
}

export default function EquipmentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sportTypeFilter, setSportTypeFilter] = useState("all_sports");
  const [categoryFilter, setCategoryFilter] = useState("all_categories");
  const [conditionFilter, setConditionFilter] = useState("all_conditions");
  
  // Fetch equipment with search and filter
  const { data, isLoading, isError } = useQuery({
    queryKey: ["equipment", searchQuery, sportTypeFilter, categoryFilter, conditionFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (searchQuery) params.search = searchQuery;
      if (sportTypeFilter && sportTypeFilter !== "all_sports") params.sportType = sportTypeFilter;
      if (categoryFilter && categoryFilter !== "all_categories") params.category = categoryFilter;
      if (conditionFilter && conditionFilter !== "all_conditions") params.condition = conditionFilter;
      
      const response = await axios.get(`${API_URL}/equipment`, { params });
      return response.data;
    },
  });

  // Get unique values for filters
  const sportTypes = data?.equipment 
    ? [...new Set(data.equipment.map((item: Equipment) => item.sportType))]
    : [];
  
  const categories = data?.equipment
    ? [...new Set(data.equipment.map((item: Equipment) => item.category))]
    : [];

  const conditions = ["New", "Like New", "Good", "Fair", "Poor"];

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Equipment Rentals</h1>
      
      {/* Search and filters */}
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
          <div className="col-span-2">
            <Input
              placeholder="Search equipment..."
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
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_categories">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={conditionFilter}
            onValueChange={setConditionFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_conditions">All Conditions</SelectItem>
              {conditions.map((condition: string) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="col-span-full md:col-span-3 md:col-start-2 grid grid-cols-2 gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSportTypeFilter("all_sports");
                setCategoryFilter("all_categories");
                setConditionFilter("all_conditions");
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
          Failed to load equipment. Please try again later.
        </div>
      )}
      
      {/* No results */}
      {data?.equipment?.length === 0 && (
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          No equipment found. Try adjusting your filters.
        </div>
      )}
      
      {/* Equipment grid */}
      {data?.equipment && data.equipment.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.equipment.map((item: Equipment) => (
            <EquipmentCard key={item._id} equipment={item} />
          ))}
        </div>
      )}
      
      {/* Pagination can be added here later */}
    </div>
  );
}
