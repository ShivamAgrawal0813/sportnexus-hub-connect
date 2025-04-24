import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';
import { Loader2, CalendarIcon, MapPin, Star, Settings, Book, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Utility function to safely format dates
const safeFormatDate = (dateString: string | undefined | null, formatString: string, fallback: string = 'Unknown date'): string => {
  if (!dateString) return fallback;
  try {
    // Try multiple date formats
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return fallback;
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

interface Booking {
  _id: string;
  venue: {
    _id: string;
    name: string;
    images: string[];
  };
  date: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  duration?: number;
  totalPrice: number;
  status: string;
}

interface Equipment {
  _id: string;
  name: string;
  images: string[];
  rentalPriceDaily: number;
  status: string;
}

interface Tutorial {
  _id: string;
  title: string;
  thumbnailUrl: string;
  author: {
    name: string;
  };
  createdAt: string;
  skillLevel: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, updateProfile } = useAuth();
  const [edit, setEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || ''
      });
    }
  }, [user]);

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['userBookings'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings`, {
          params: { itemType: 'venue' },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Log the response to see what data structure we're getting
        console.log('Bookings API response:', response.data);
        
        // Map the response data to match our interface if needed
        if (response.data && response.data.bookings) {
          return response.data.bookings.map((booking: any) => {
            // Calculate duration from timeSlot if it exists but duration doesn't
            let calculatedDuration;
            if (!booking.duration && booking.timeSlot) {
              const startHour = parseInt(booking.timeSlot.start.split(':')[0]);
              const endHour = parseInt(booking.timeSlot.end.split(':')[0]);
              calculatedDuration = endHour - startHour;
            }
            
            return {
              ...booking,
              // Ensure these fields exist
              duration: booking.duration || calculatedDuration || 1,
              status: booking.status || 'pending'
            };
          });
        }
        
        return response.data.bookings || [];
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch equipment rentals
  const { data: rentals, isLoading: rentalsLoading } = useQuery({
    queryKey: ['userRentals'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings`, {
          params: { itemType: 'equipment' },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        return response.data.bookings || [];
      } catch (error) {
        console.error('Error fetching rentals:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch enrolled tutorials
  const { data: tutorials, isLoading: tutorialsLoading } = useQuery({
    queryKey: ['userTutorials'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/tutorials/enrolled`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        return response.data.tutorials || [];
      } catch (error) {
        console.error('Error fetching tutorials:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return axios.put(
        `${API_URL}/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    },
    onSuccess: (response) => {
      updateProfile(response.data);
      setEdit(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Not Logged In</h1>
          <p className="mb-4">Please log in to view your profile</p>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="relative pb-0">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEdit(!edit)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-2">
                  <AvatarImage src={user.profile?.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!edit ? (
                  <>
                    <CardTitle className="text-center text-2xl mt-2">
                      {user.name}
                    </CardTitle>
                    <CardDescription className="text-center">
                      {user.email}
                    </CardDescription>
                    {user.profile?.phone && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.profile.phone}
                      </p>
                    )}
                    <div className="mt-4 text-center">
                      <p className="text-sm">{user.profile?.bio || 'No bio provided'}</p>
                    </div>
                  </>
                ) : (
                  <CardTitle className="text-center text-xl mt-2">
                    Edit Profile
                  </CardTitle>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {edit ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setEdit(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Member since{' '}
                      {safeFormatDate(user.createdAt, 'MMMM yyyy')}
                    </span>
                  </div>
                  <Button className="w-full" asChild>
                    <a href="/settings">Account Settings</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="bookings">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bookings">
                <MapPin className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="rentals">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Rentals
              </TabsTrigger>
              <TabsTrigger value="tutorials">
                <Book className="h-4 w-4 mr-2" />
                Tutorials
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Your Venue Bookings</CardTitle>
                  <CardDescription>
                    View all your venue bookings and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : bookings && bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="flex flex-col md:flex-row gap-4 border rounded-lg p-4"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden">
                              <img
                                src={(booking.venue && booking.venue.images && booking.venue.images.length > 0) ? booking.venue.images[0] : '/placeholder-venue.jpg'}
                                alt={booking.venue ? booking.venue.name : 'Venue'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{booking.venue?.name || "Unknown Venue"}</h3>
                            <div className="text-sm space-y-1 mt-1">
                              <p>
                                <span className="text-muted-foreground">Date: </span>
                                {safeFormatDate(booking.date, 'dd MMM yyyy')}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Duration: </span>
                                {booking.duration ? `${booking.duration} hour${booking.duration > 1 ? 's' : ''}` : 
                                 (booking.timeSlot ? `${booking.timeSlot.start} - ${booking.timeSlot.end}` : 'Not specified')}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Total: </span>
                                ${booking.totalPrice !== undefined ? booking.totalPrice.toFixed(2) : '0.00'}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-start">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'confirmed' || booking.status === 'Confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending' || booking.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : booking.status === 'cancelled' || booking.status === 'Cancelled' || booking.status === 'canceled' || booking.status === 'Canceled'
                                  ? 'bg-red-100 text-red-800'
                                  : booking.status === 'completed' || booking.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {booking.status ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1)) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You have no bookings yet</p>
                      <Button asChild variant="outline">
                        <a href="/venues">Explore Venues</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rentals Tab */}
            <TabsContent value="rentals">
              <Card>
                <CardHeader>
                  <CardTitle>Your Equipment Rentals</CardTitle>
                  <CardDescription>
                    View all your equipment rentals and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rentalsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : rentals && rentals.length > 0 ? (
                    <div className="space-y-4">
                      {rentals.map((rental) => (
                        <div
                          key={rental._id}
                          className="flex flex-col md:flex-row gap-4 border rounded-lg p-4"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden">
                              <img
                                src={(rental.equipment && rental.equipment.length > 0 && rental.equipment[0].images && rental.equipment[0].images.length > 0) ? 
                                  rental.equipment[0].images[0] : '/placeholder-equipment.jpg'}
                                alt={(rental.equipment && rental.equipment.length > 0) ? rental.equipment[0].name : "Equipment"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{(rental.equipment && rental.equipment.length > 0) ? rental.equipment[0].name : "Equipment Rental"}</h3>
                            <div className="text-sm mt-1">
                              <p>
                                <span className="text-muted-foreground">Daily Rate: </span>
                                ${(rental.equipment && rental.equipment.length > 0 && rental.equipment[0].rentalPriceDaily !== undefined) ? 
                                  rental.equipment[0].rentalPriceDaily.toFixed(2) : '0.00'}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Rental Date: </span>
                                {safeFormatDate(rental.date, 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-start">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                rental.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : rental.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : rental.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You have no equipment rentals yet</p>
                      <Button asChild variant="outline">
                        <a href="/equipment">Browse Equipment</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tutorials Tab */}
            <TabsContent value="tutorials">
              <Card>
                <CardHeader>
                  <CardTitle>Your Tutorial Enrollments</CardTitle>
                  <CardDescription>
                    View all tutorials you're enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tutorialsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : tutorials && tutorials.length > 0 ? (
                    <div className="space-y-4">
                      {tutorials.map((tutorial) => (
                        <div
                          key={tutorial._id}
                          className="flex flex-col md:flex-row gap-4 border rounded-lg p-4"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden">
                              <img
                                src={tutorial.thumbnailUrl || '/placeholder-tutorial.jpg'}
                                alt={tutorial.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium">{tutorial.title}</h3>
                            <div className="text-sm space-y-1 mt-1">
                              <p>
                                <span className="text-muted-foreground">Instructor: </span>
                                {tutorial.author && tutorial.author.name ? tutorial.author.name : 'Unknown instructor'}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Created: </span>
                                {safeFormatDate(tutorial.createdAt, 'dd MMM yyyy')}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Level: </span>
                                {tutorial.skillLevel}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/tutorials/${tutorial._id}`}>
                                <Star className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You are not enrolled in any tutorials yet</p>
                      <Button asChild variant="outline">
                        <a href="/tutorials">Explore Tutorials</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden debug element */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border rounded bg-gray-50 hidden">
          <h3 className="text-sm font-bold mb-2">Debug Data:</h3>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify({ bookings, rentals, tutorials }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
