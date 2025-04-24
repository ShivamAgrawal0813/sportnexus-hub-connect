import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  itemType: 'venue' | 'equipment' | 'tutorial';
  venue?: mongoose.Types.ObjectId;
  equipment?: mongoose.Types.ObjectId[];
  tutorial?: mongoose.Types.ObjectId;
  date: Date;
  timeSlot?: {
    start: string;
    end: string;
  };
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'stripe' | 'paypal' | 'wallet';
  discountCode?: string;
  discountAmount?: number;
  subtotalPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: ['venue', 'equipment', 'tutorial'],
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: function(this: IBooking) {
        return this.itemType === 'venue';
      },
    },
    equipment: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Equipment',
      required: function(this: IBooking) {
        return this.itemType === 'equipment';
      },
    },
    tutorial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: function(this: IBooking) {
        return this.itemType === 'tutorial';
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    timeSlot: {
      start: String,
      end: String,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'confirmed', 'canceled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'wallet'],
    },
    discountCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    subtotalPrice: {
      type: Number,
      required: [true, 'Subtotal price is required'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ venue: 1, date: 1 });
BookingSchema.index({ 'equipment': 1, date: 1 });
BookingSchema.index({ tutorial: 1, date: 1 });
BookingSchema.index({ paymentStatus: 1 });

export default mongoose.model<IBooking>('Booking', BookingSchema); 