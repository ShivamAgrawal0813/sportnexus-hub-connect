import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  token: {
    type: String,
    required: [true, 'Token is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h' // Document will be automatically deleted after 1 hour
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required']
  }
});

// Create index for faster lookup
PasswordResetSchema.index({ token: 1 });
PasswordResetSchema.index({ user: 1 });

export default mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema); 