import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { TutorialCard } from "@/components/cards/TutorialCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Tutorial {
  _id: string;
  title: string;
  description: string;
  content: string;
  sportType: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  author: {
    _id: string;
    name: string;
  };
  tags: string[];
  resources: {
    title: string;
    url: string;
    type: 'Video' | 'PDF' | 'Article' | 'Link';
  }[];
  likes: number;
  views: number;
  tutorialType: 'Free' | 'Premium';
  price: number;
  [key: string]: any;
}

export default function TutorialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sportTypeFilter, setSportTypeFilter] = useState("all_sports");
  const [skillLevelFilter, setSkillLevelFilter] = useState("all_levels");
  const [tutorialTypeFilter, setTutorialTypeFilter] = useState("all_types");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  
  // Fetch tutorials with search and filter
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tutorials", searchQuery, sportTypeFilter, skillLevelFilter, tutorialTypeFilter, maxPriceFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (searchQuery) params.search = searchQuery;
      if (sportTypeFilter && sportTypeFilter !== "all_sports") params.sportType = sportTypeFilter;
      if (skillLevelFilter && skillLevelFilter !== "all_levels") params.skillLevel = skillLevelFilter;
      if (tutorialTypeFilter && tutorialTypeFilter !== "all_types") params.tutorialType = tutorialTypeFilter;
      if (maxPriceFilter !== null) params.maxPrice = maxPriceFilter.toString();
      
      const response = await axios.get(`${API_URL}/tutorials`, { params });
      return response.data;
    },
  });

  // Get unique sport types for filters
  const sportTypes = data?.tutorials 
    ? [...new Set(data.tutorials.map((tutorial: Tutorial) => tutorial.sportType))]
    : [];
  
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
  const tutorialTypes = ['Free', 'Premium'];
  
  // Find max price in data or use default
  const maxPriceInData = data?.tutorials
    ? Math.max(...data.tutorials.map((tutorial: Tutorial) => tutorial.price), 100)
    : 100;

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply the currently selected max price from the slider
    setMaxPriceFilter(priceRange[1] >= maxPriceInData ? null : priceRange[1]);
  };

  // Handle price slider change
  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSportTypeFilter("all_sports");
    setSkillLevelFilter("all_levels");
    setTutorialTypeFilter("all_types");
    setPriceRange([0, maxPriceInData]);
    setMaxPriceFilter(null);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Sports Tutorials</h1>
      
      {/* Search and filters */}
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="col-span-2">
              <Input
                placeholder="Search tutorials..."
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
              value={skillLevelFilter}
              onValueChange={setSkillLevelFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Skill Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_levels">All Levels</SelectItem>
                {skillLevels.map((level: string) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            <Select
              value={tutorialTypeFilter}
              onValueChange={setTutorialTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutorial Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
                {tutorialTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="col-span-3">
              <Label htmlFor="price-range" className="mb-2 block">
                Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </Label>
              <Slider
                id="price-range"
                defaultValue={[0, maxPriceInData]}
                value={priceRange}
                max={maxPriceInData}
                step={1}
                minStepsBetweenThumbs={1}
                onValueChange={handlePriceChange}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
            <Button type="submit">Apply Filters</Button>
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
          Failed to load tutorials. Please try again later.
        </div>
      )}
      
      {/* No results */}
      {data?.tutorials?.length === 0 && (
        <div className="flex justify-center items-center h-64 text-muted-foreground">
          No tutorials found. Try adjusting your filters.
        </div>
      )}
      
      {/* Tutorials grid */}
      {data?.tutorials && data.tutorials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.tutorials.map((tutorial: Tutorial) => (
            <TutorialCard key={tutorial._id} tutorial={tutorial} />
          ))}
        </div>
      )}
      
      {/* Pagination can be added here later */}
    </div>
  );
}
