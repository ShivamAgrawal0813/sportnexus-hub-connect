import mongoose, { Document, Schema } from 'mongoose';

export interface ITutorial extends Document {
  title: string;
  description: string;
  content: string;
  sportType: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number; // in minutes
  author: mongoose.Types.ObjectId;
  tags: string[];
  resources: {
    title: string;
    url: string;
    type: 'Video' | 'PDF' | 'Article' | 'Link';
  }[];
  likes: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const TutorialSchema = new Schema<ITutorial>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    sportType: {
      type: String,
      required: [true, 'Sport type is required'],
    },
    skillLevel: {
      type: String,
      required: [true, 'Skill level is required'],
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    },
    videoUrl: String,
    thumbnailUrl: String,
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    tags: [String],
    resources: [
      {
        title: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['Video', 'PDF', 'Article', 'Link'],
          required: true,
        },
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search functionality
TutorialSchema.index({ 
  title: 'text', 
  description: 'text', 
  content: 'text', 
  sportType: 'text',
  tags: 'text'
});

export default mongoose.model<ITutorial>('Tutorial', TutorialSchema); 