import { LucideIcon } from "lucide-react";

// Type definitions for SportNexus Hub

// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  profile?: {
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    preferences?: {
      sportTypes?: string[];
      notifications?: boolean;
    };
    favorites?: {
      venues?: string[];
      equipment?: string[];
      tutorials?: string[];
    };
  };
  token?: string;
}

// Venue types
export interface Venue {
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
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  totalPrice: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

// Equipment types
export interface Equipment {
  _id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  images: string[];
  sportType: string;
  condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
  purchasePrice: number;
  rentalPriceDaily: number;
  availability: "In Stock" | "Low Stock" | "Out of Stock" | "Discontinued";
  quantity: number;
  specifications?: Record<string, any>;
  features: string[];
  warranty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  userId: string;
  equipmentId: string;
  fromDate: string;
  toDate: string;
  status: RentalStatus;
  totalPrice: number;
}

export type RentalStatus = 'pending' | 'active' | 'returned' | 'cancelled';

// Tutorial types
export interface Tutorial {
  _id: string;
  title: string;
  description: string;
  content: string;
  sportType: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
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
    type: "Video" | "PDF" | "Article" | "Link";
  }[];
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
}
