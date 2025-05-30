import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Loader2, 
  BookOpen, 
  Clock, 
  Tag, 
  ThumbsUp, 
  Eye, 
  Play,
  ExternalLink,
  FileText,
  Link2,
  User,
  Edit,
  Lock,
  DollarSign,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReviewList from '@/components/reviews/ReviewList';
import { formatYouTubeUrl } from "@/utils/videoUtils";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import TutorialPayment from "@/components/payment/TutorialPayment";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Resource {
  title: string;
  url: string;
  type: 'Video' | 'PDF' | 'Article' | 'Link';
}

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
  resources: Resource[];
  likes: number;
  views: number;
  tutorialType: 'Free' | 'Premium';
  price: number;
  isPurchased?: boolean;
  isPreview?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InsufficientFundsError {
  currentBalance: number;
  requiredAmount: number;
}

export default function TutorialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showInsufficientFundsDialog, setShowInsufficientFundsDialog] = useState(false);
  const [walletInfo, setWalletInfo] = useState<InsufficientFundsError | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const { data: tutorial, isLoading, isError } = useQuery({
    queryKey: ["tutorial", id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/tutorials/${id}`, { headers });
      return response.data;
    },
  });

  // Handle closing the insufficient funds dialog
  const handleCloseDialog = () => {
    setShowInsufficientFundsDialog(false);
  };

  // Handle navigate to wallet to add funds
  const handleAddFunds = () => {
    navigate('/profile/wallet');
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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

  // Map skill level to badge variant
  const skillLevelVariant = (level: string) => {
    switch (level) {
      case 'Beginner': return 'outline';
      case 'Intermediate': return 'default';
      case 'Advanced': return 'secondary';
      case 'All Levels': return 'secondary';
      default: return 'outline';
    }
  };

  // Map tutorial type to badge variant
  const tutorialTypeVariant = (type: string) => {
    return type === 'Premium' ? 'destructive' : 'secondary';
  };

  // Get resource icon based on type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Play className="h-4 w-4 mr-2" />;
      case 'PDF': return <FileText className="h-4 w-4 mr-2" />;
      case 'Article': return <ExternalLink className="h-4 w-4 mr-2" />;
      case 'Link': return <Link2 className="h-4 w-4 mr-2" />;
      default: return <Link2 className="h-4 w-4 mr-2" />;
    }
  };

  // Handle initiating purchase
  const handlePurchase = () => {
    if (!isAuthenticated) {
      toast.error("Please login to purchase this tutorial");
      return;
    }
    
    // Show payment dialog instead of automatic wallet deduction
    setShowPaymentDialog(true);
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    // Close the payment dialog
    setShowPaymentDialog(false);
    
    // Show success message
    toast.success("Tutorial purchased successfully!");
    
    // Refresh the tutorial data
    queryClient.invalidateQueries({ queryKey: ["tutorial", id] });
  };

  // Handle canceling payment
  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  if (isLoading) {
    return <TutorialDetailSkeleton />;
  }

  if (isError || !tutorial) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load tutorial</h2>
          <p>We couldn't find the tutorial you're looking for. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        {/* Tutorial Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{tutorial.title}</h1>
              <Badge variant={tutorialTypeVariant(tutorial.tutorialType)}>
                {tutorial.tutorialType}
              </Badge>
              {tutorial.tutorialType === 'Premium' && (
                <span className="text-lg font-bold text-primary">{formatPrice(tutorial.price)}</span>
              )}
            </div>
            
            {/* Edit button - only visible to the author */}
            {user && user._id === tutorial.author._id && (
              <Link to={`/admin/edit-tutorial/${tutorial._id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mb-4 text-muted-foreground">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              <span>{tutorial.sportType}</span>
            </div>
            <div className="flex items-center">
              <Badge variant={skillLevelVariant(tutorial.skillLevel)} className="text-white">
                {tutorial.skillLevel}
              </Badge>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDuration(tutorial.duration)}</span>
            </div>
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{tutorial.likes} likes</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{tutorial.views} views</span>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>{tutorial.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">By {tutorial.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(tutorial.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {tutorial.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Video Section */}
        {tutorial.videoUrl && (
          <div className="mb-8">
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={formatYouTubeUrl(tutorial.videoUrl)}
                className="w-full h-full"
                allowFullScreen
                title={tutorial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              ></iframe>
            </div>
          </div>
        )}

        {/* Thumbnail if no video */}
        {!tutorial.videoUrl && tutorial.thumbnailUrl && (
          <div className="mb-8">
            <div className="aspect-video overflow-hidden rounded-lg">
              <img 
                src={tutorial.thumbnailUrl}
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Tutorial Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About this tutorial</h2>
              <p className="text-muted-foreground mb-6">{tutorial.description}</p>
              
              <h2 className="text-xl font-semibold mb-4">Content</h2>
              
              {/* Premium tutorial with limited content preview */}
              {tutorial.tutorialType === 'Premium' && tutorial.isPreview && (
                <div>
                  <div className="prose max-w-none text-muted-foreground mb-4">
                    {tutorial.content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                  
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <Lock className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold mb-2">Premium Content</h3>
                    <p className="mb-4">Purchase this tutorial to access the full content and all resources.</p>
                    <Button 
                      size="lg" 
                      onClick={handlePurchase}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Purchase for {formatPrice(tutorial.price)}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Free tutorial or purchased premium tutorial */}
              {(tutorial.tutorialType === 'Free' || !tutorial.isPreview) && (
                <div className="prose max-w-none text-muted-foreground">
                  {tutorial.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            {/* Call to Action */}
            <div className="mb-6">
              {tutorial.tutorialType === 'Premium' && tutorial.isPreview ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePurchase}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Purchase for {formatPrice(tutorial.price)}
                </Button>
              ) : (
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" /> Start Learning
                </Button>
              )}
            </div>

            {/* Resources - Only show for free tutorials or purchased premium tutorials */}
            {tutorial.resources && tutorial.resources.length > 0 && (!tutorial.isPreview || tutorial.tutorialType === 'Free') && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Resources</h3>
                  <ul className="space-y-3">
                    {tutorial.resources.map((resource, index) => (
                      <li key={index}>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          {getResourceIcon(resource.type)}
                          <span>{resource.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Resources locked message for premium tutorials */}
            {tutorial.tutorialType === 'Premium' && tutorial.isPreview && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Resources</h3>
                  <div className="text-center p-4">
                    <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Purchase this tutorial to access all resources.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Tutorials Placeholder */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">You might also like</h3>
                <p className="text-sm text-muted-foreground">Similar tutorials will be shown here.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Reviews Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Reviews</h2>
          <ReviewList
            type="tutorial"
            itemId={tutorial._id}
            itemName={tutorial.title}
          />
        </div>
      </div>

      {/* Insufficient Funds Dialog */}
      <Dialog open={showInsufficientFundsDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Funds</DialogTitle>
            <DialogDescription>
              You don't have enough funds in your wallet to purchase this tutorial.
            </DialogDescription>
          </DialogHeader>
          
          {walletInfo && (
            <div className="py-4">
              <div className="flex justify-between items-center mb-2">
                <span>Current Balance:</span>
                <span className="font-medium">{formatPrice(walletInfo.currentBalance)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Tutorial Price:</span>
                <span className="font-medium">{formatPrice(walletInfo.requiredAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Required Additional Funds:</span>
                <span className="font-bold text-destructive">
                  {formatPrice(walletInfo.requiredAmount - walletInfo.currentBalance)}
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleAddFunds}>
              <Wallet className="h-4 w-4 mr-2" />
              Add Funds to Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {tutorial && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Purchase Tutorial</DialogTitle>
              <DialogDescription>
                Choose your preferred payment method to purchase this tutorial.
              </DialogDescription>
            </DialogHeader>
            
            <TutorialPayment
              tutorialId={tutorial._id}
              tutorialTitle={tutorial.title}
              price={tutorial.price}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function TutorialDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-10 w-2/3 mb-2" />
        
        <div className="flex flex-wrap gap-4 mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-8 rounded-full mr-2" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24 mt-1" />
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Video Skeleton */}
      <Skeleton className="aspect-video w-full rounded-lg mb-8" />

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="md:col-span-1">
          <Skeleton className="h-10 w-full mb-6" />
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Loader2 className="animate-spin h-8 w-8 mx-auto my-16 text-primary" />
    </div>
  );
} 