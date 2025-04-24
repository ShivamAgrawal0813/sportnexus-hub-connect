import mongoose, { Document, Schema } from 'mongoose';

export interface IVenue extends Document {
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
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
    },
    images: [String],
    sportTypes: {
      type: [String],
      required: [true, 'At least one sport type is required'],
    },
    amenities: [String],
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
    },
    availableTimeSlots: [
      {
        day: {
          type: String,
          required: true,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        openTime: {
          type: String,
          required: true,
        },
        closeTime: {
          type: String,
          required: true,
        },
      },
    ],
    rules: [String],
    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      website: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search functionality
VenueSchema.index({ 
  name: 'text', 
  description: 'text', 
  sportTypes: 'text', 
  city: 'text' 
});

export default mongoose.model<IVenue>('Venue', VenueSchema); 