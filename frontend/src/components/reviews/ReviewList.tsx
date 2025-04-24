import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Star, StarIcon, ThumbsUp, Loader2, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  rating: number;
  title?: string;
  content?: string;
  comment?: string;
  likes: number;
  createdAt: string;
  response?: {
    content: string;
    createdAt: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewListProps {
  type: 'venue' | 'equipment' | 'tutorial';
  itemId: string;
  itemName: string;
}

export default function ReviewList({ type, itemId, itemName }: ReviewListProps) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch reviews
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', type, itemId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/reviews/${type}/${itemId}`);
      return {
        reviews: response.data.reviews as Review[],
        stats: response.data.stats as ReviewStats,
      };
    },
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      console.log(`Sending POST request to ${API_URL}/reviews/${type}/${itemId}`);
      try {
        const response = await axios.post(
          `${API_URL}/reviews/${type}/${itemId}`,
          {
            rating,
            title: reviewTitle,
            content: reviewContent,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        console.log('Review submission successful:', response.data);
        return response;
      } catch (error) {
        console.error('Review submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Review added successfully!');
      queryClient.invalidateQueries({ queryKey: ['reviews', type, itemId] });
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewContent('');
      setRating(0);
    },
    onError: (error: any) => {
      console.error('Review mutation error:', error);
      toast.error(error.response?.data?.message || 'Failed to add review');
    },
  });

  // Like review mutation
  const likeReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return axios.post(
        `${API_URL}/reviews/${reviewId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', type, itemId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to like review');
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting review:', {
      type,
      itemId,
      rating,
      title: reviewTitle,
      content: reviewContent
    });
    
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!reviewTitle.trim()) {
      toast.error('Please enter a review title');
      return;
    }
    
    if (!reviewContent.trim()) {
      toast.error('Please enter review content');
      return;
    }
    
    addReviewMutation.mutate();
  };

  const handleLikeReview = (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like reviews');
      return;
    }
    
    likeReviewMutation.mutate(reviewId);
  };

  // Generate star rating display
  const StarRating = ({ value }: { value: number }) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-4 w-4 ${
            star <= value
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-none text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  // Interactive star rating input
  const StarRatingInput = () => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <StarIcon
            className={`h-6 w-6 ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const stats = data?.stats || { averageRating: 0, totalReviews: 0 };

  // Review display component
  const ReviewItem = ({ review }: { review: Review }) => {
    // Get the review content from either content or comment field
    const reviewContent = review.content || review.comment;
    
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{review.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <StarRating value={review.rating} />
          </div>
          
          {review.title && <h4 className="font-semibold mb-1">{review.title}</h4>}
          <p className="text-muted-foreground mb-3">{reviewContent}</p>
          
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => handleLikeReview(review._id)}>
              <ThumbsUp className="h-4 w-4 mr-2" />
              {review.likes || 0}
            </Button>
          </div>
          
          {review.response && (
            <div className="mt-4 bg-muted p-3 rounded-md">
              <p className="text-xs font-medium mb-1">Response from the owner</p>
              <p className="text-sm text-muted-foreground">{review.response.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(review.response.createdAt), { addSuffix: true })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Show if no reviews are available
  const EmptyReviews = () => (
    <div className="text-center py-6 bg-muted/50 rounded-lg">
      <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
      <h3 className="font-medium text-lg mb-1">No Reviews Yet</h3>
      <p className="text-muted-foreground mb-4">Be the first to share your experience!</p>
      {isAuthenticated ? (
        <Button 
          variant="outline" 
          onClick={() => setShowReviewForm(true)}
          className="mx-auto"
        >
          <Star className="h-4 w-4 mr-2" /> Write a Review
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Please <Link to="/login" className="text-primary hover:underline">log in</Link> to write a review
        </p>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="flex items-center mt-1">
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium mr-1">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground">
              ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
        {isAuthenticated && (
          <Button 
            onClick={() => setShowReviewForm(!showReviewForm)} 
            variant={showReviewForm ? "secondary" : "default"}
            className="mt-4 md:mt-0"
          >
            {showReviewForm ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" /> Hide Form
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" /> Write a Review
              </>
            )}
          </Button>
        )}
      </div>

      {showReviewForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>
              Share your experience with {itemName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Rating</label>
                <StarRatingInput />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Summarize your experience"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Review</label>
                <Textarea
                  placeholder="Tell others about your experience..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={addReviewMutation.isPending}
                >
                  {addReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewItem key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
} 