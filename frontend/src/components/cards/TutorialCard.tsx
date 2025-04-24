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
import { Clock, BookOpen, ThumbsUp, Eye, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface TutorialCardProps {
  tutorial: {
    _id: string;
    title: string;
    description: string;
    sportType: string;
    skillLevel: string;
    thumbnailUrl?: string;
    duration: number;
    author: {
      _id: string;
      name: string;
    };
    tags: string[];
    likes: number;
    views: number;
  };
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  // Display thumbnail or placeholder
  const imageUrl = tutorial.thumbnailUrl 
    ? tutorial.thumbnailUrl
    : "https://placehold.co/600x400?text=No+Image";

  // Map skill level to badge variant
  const skillLevelVariant = () => {
    switch (tutorial.skillLevel) {
      case 'Beginner': return 'outline';
      case 'Intermediate': return 'default';
      case 'Advanced': return 'secondary';
      case 'All Levels': return 'secondary';
      default: return 'outline';
    }
  };

  // Format duration to show in minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={tutorial.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={skillLevelVariant()} className="text-white">
            {tutorial.skillLevel}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl line-clamp-1">{tutorial.title}</CardTitle>
          <div className="flex items-center text-muted-foreground text-sm">
            <BookOpen className="h-4 w-4 mr-1" />
            <span>By {tutorial.author.name}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <CardDescription className="line-clamp-2 mb-3">
          {tutorial.description}
        </CardDescription>
        
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline">{tutorial.sportType}</Badge>
          {tutorial.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {tutorial.tags.length > 2 && (
            <Badge variant="outline">+{tutorial.tags.length - 2} more</Badge>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{formatDuration(tutorial.duration)}</span>
          </div>
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{tutorial.likes}</span>
          </div>
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{tutorial.views}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link to={`/tutorials/${tutorial._id}`}>
            <Info className="h-4 w-4 mr-2" /> View Tutorial
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 