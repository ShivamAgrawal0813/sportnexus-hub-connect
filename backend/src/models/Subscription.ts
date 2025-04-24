import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface ISubscription extends Document {
  user: IUser['_id'];
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'expired';
  stripeSubscriptionId?: string;
  paypalSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  features: string[];
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      required: true,
      enum: ['basic', 'premium', 'pro'],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'canceled', 'expired'],
      default: 'active',
    },
    stripeSubscriptionId: {
      type: String,
    },
    paypalSubscriptionId: {
      type: String,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    features: [{
      type: String,
    }],
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema); 