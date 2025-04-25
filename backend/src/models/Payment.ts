import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IBooking } from './Booking';

export interface IPayment extends Document {
  user: IUser['_id'];
  booking?: IBooking['_id'];
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'wallet' | 'card';
  stripePaymentId?: string;
  paypalPaymentId?: string;
  itemType?: 'venue' | 'equipment' | 'tutorial';
  itemId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'wallet', 'card'],
    },
    stripePaymentId: {
      type: String,
    },
    paypalPaymentId: {
      type: String,
    },
    itemType: {
      type: String,
      enum: ['venue', 'equipment', 'tutorial'],
    },
    itemId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    refundReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema); 