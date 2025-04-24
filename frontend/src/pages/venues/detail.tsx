import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CalendarIcon,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Star,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Loader2,
  InfoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, addHours, setHours, setMinutes, isBefore } from 'date-fns';
import { API_URL } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReviewList from '@/components/reviews/ReviewList';

interface Venue {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  images: string[];
  sportTypes: string[];
  amenities: string[];
  pricePerHour: number;
  capacity: number;
  availableTimeSlots: {
    day: string;
    openTime: string;
    closeTime: string;
  }[];
  rules: string[];
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  rating: number;
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('10:00');
  const [duration, setDuration] = useState<string>('1');
  const [participants, setParticipants] = useState<string>('1');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  
  // Fetch venue details
  const { data: venue, isLoading, isError } = useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/venues/${id}`);
      return response.data;
    },
  });

  // Book venue mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return axios.post(`${API_URL}/bookings/venue`, bookingData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      toast.success('Venue booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      navigate('/profile/bookings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book venue. Please try again.');
    },
  });

  // Favorite venue mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      return axios.post(`${API_URL}/auth/favorites/venues/${id}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    },
    onSuccess: () => {
      toast.success('Added to favorites!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to favorites.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Venue</h2>
        <p className="mb-6 text-muted-foreground">
          We couldn't load the venue details. Please try again.
        </p>
        <Button variant="outline" onClick={() => navigate('/venues')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Venues
        </Button>
      </div>
    );
  }

  // Calculate end time based on start time and duration
  const calculateEndTime = () => {
    if (!selectedDate || !startTime) return null;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
    const endDateTime = addHours(startDateTime, parseInt(duration));
    
    return endDateTime;
  };

  const endTime = calculateEndTime();

  // Parse start time for validation
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startDateTime = selectedDate 
    ? setMinutes(setHours(selectedDate, startHours), startMinutes)
    : null;

  const handleBookVenue = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book this venue');
      navigate('/login', { state: { from: `/venues/${id}` } });
      return;
    }

    if (!selectedDate || !startTime || !endTime) {
      toast.error('Please select a valid date and time');
      return;
    }

    const bookingData = {
      venueId: id,
      startDate: startDateTime?.toISOString(),
      endDate: endTime.toISOString(),
      participants: parseInt(participants),
      specialRequests,
    };

    bookingMutation.mutate(bookingData);
  };

  const handleAddToFavorites = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add to favorites');
      navigate('/login', { state: { from: `/venues/${id}` } });
      return;
    }

    favoriteMutation.mutate();
  };

  // Check if the selected time is in the past
  const isPastTime = startDateTime ? isBefore(startDateTime, new Date()) : false;

  // Generate time slots (hourly from 6AM to 10PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6; // Start from 6 AM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/venues')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Venues
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Venue Details (Left Column) */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="rounded-lg overflow-hidden mb-4 h-[400px]">
              <img
                src={venue.images[0] || 'https://placehold.co/800x400?text=No+Image'}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            </div>

            {venue.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {venue.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="rounded-md overflow-hidden h-20">
                    <img
                      src={image}
                      alt={`${venue.name} - ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{venue.name}</h1>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {venue.rating.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center text-muted-foreground mb-4">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {venue.address}, {venue.city}, {venue.state} {venue.zipCode}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {venue.sportTypes.map((sport) => (
                <Badge key={sport} variant="secondary">
                  {sport}
                </Badge>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{venue.description}</p>
            </div>

            {venue.amenities && venue.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Amenities</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {venue.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {venue.rules && venue.rules.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Rules</h2>
                <ul className="space-y-1">
                  {venue.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <InfoIcon className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-muted-foreground" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{venue.contactInfo.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{venue.contactInfo.email}</span>
                </div>
                {venue.contactInfo.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a
                      href={venue.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <Separator className="my-8" />
            <ReviewList
              type="venue"
              itemId={id || ''}
              itemName={venue.name}
            />
          </div>
        </div>

        {/* Booking Card (Right Column) */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Book this Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                    <span className="text-xl font-bold">
                      ${venue.pricePerHour}
                    </span>
                    <span className="text-muted-foreground ml-1">/hour</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Up to {venue.capacity} people</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => 
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (hours)</label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((hours) => (
                          <SelectItem key={hours} value={hours.toString()}>
                            {hours} {hours === 1 ? 'hour' : 'hours'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Participants</label>
                  <Select value={participants} onValueChange={setParticipants}>
                    <SelectTrigger>
                      <SelectValue placeholder="Participants" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'person' : 'people'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Requests (Optional)</label>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </div>

                {selectedDate && endTime && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total price:</span>
                      <span className="font-medium">
                        ${venue.pricePerHour * parseInt(duration)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time slot:</span>
                      <span>
                        {startDateTime && format(startDateTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )}

                {isPastTime && (
                  <div className="text-red-500 text-sm">
                    Please select a future date and time.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleBookVenue}
                    disabled={
                      !selectedDate || 
                      !startTime || 
                      !endTime || 
                      isPastTime || 
                      bookingMutation.isPending
                    }
                    className="w-full"
                  >
                    {bookingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book Now'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAddToFavorites}
                    disabled={favoriteMutation.isPending}
                    className="w-full"
                  >
                    {favoriteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add to Favorites'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 