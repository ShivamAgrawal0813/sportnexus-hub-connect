import mongoose, { Document, Schema } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  images: string[];
  sportType: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  purchasePrice: number;
  rentalPriceDaily: number;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  quantity: number;
  specifications: Record<string, any>;
  features: string[];
  warranty: string;
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
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
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
    },
    images: [String],
    sportType: {
      type: String,
      required: [true, 'Sport type is required'],
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
    },
    rentalPriceDaily: {
      type: Number,
      required: [true, 'Rental price is required'],
    },
    availability: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
      default: 'In Stock',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    features: [String],
    warranty: String,
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
EquipmentSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text', 
  sportType: 'text',
  category: 'text'
});

export default mongoose.model<IEquipment>('Equipment', EquipmentSchema); 