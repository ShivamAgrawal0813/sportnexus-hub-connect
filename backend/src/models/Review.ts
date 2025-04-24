import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  itemType: 'venue' | 'equipment' | 'tutorial';
  venue?: mongoose.Types.ObjectId;
  equipment?: mongoose.Types.ObjectId;
  tutorial?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  likes?: number;
  response?: {
    content: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
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
      required: function(this: IReview) {
        return this.itemType === 'venue';
      },
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: function(this: IReview) {
        return this.itemType === 'equipment';
      },
    },
    tutorial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: function(this: IReview) {
        return this.itemType === 'tutorial';
      },
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    response: {
      content: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes to ensure users can only review an item once
ReviewSchema.index(
  { user: 1, itemType: 1, venue: 1 },
  { unique: true, partialFilterExpression: { itemType: 'venue', venue: { $exists: true } } }
);

ReviewSchema.index(
  { user: 1, itemType: 1, equipment: 1 },
  { unique: true, partialFilterExpression: { itemType: 'equipment', equipment: { $exists: true } } }
);

ReviewSchema.index(
  { user: 1, itemType: 1, tutorial: 1 },
  { unique: true, partialFilterExpression: { itemType: 'tutorial', tutorial: { $exists: true } } }
);

export default mongoose.model<IReview>('Review', ReviewSchema); 