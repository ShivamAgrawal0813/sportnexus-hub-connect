import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscount extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  applicableItems: 'all' | 'equipment' | 'venue' | 'tutorial';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscountSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed'],
    },
    value: {
      type: Number,
      required: true,
    },
    maxUses: {
      type: Number,
      required: true,
    },
    currentUses: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    minOrderValue: {
      type: Number,
    },
    maxDiscountAmount: {
      type: Number,
    },
    applicableItems: {
      type: String,
      required: true,
      enum: ['all', 'equipment', 'venue', 'tutorial'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDiscount>('Discount', DiscountSchema); 