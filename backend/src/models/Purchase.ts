import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  user: mongoose.Schema.Types.ObjectId;
  tutorialId: mongoose.Schema.Types.ObjectId;
  price: number;
  originalPrice?: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: mongoose.Schema.Types.ObjectId;
  purchaseDate: Date;
  discountApplied?: {
    code: string;
    value: number;
    type: 'fixed' | 'percentage';
  };
  paymentMethod?: 'wallet' | 'card' | 'other';
}

const PurchaseSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tutorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: [true, 'Tutorial ID is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    discountApplied: {
      code: String,
      value: Number,
      type: {
        type: String,
        enum: ['fixed', 'percentage']
      }
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'card', 'other'],
      default: 'wallet'
    }
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
PurchaseSchema.index({ user: 1, tutorialId: 1 }, { unique: true });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema); 