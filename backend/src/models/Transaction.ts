import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Schema.Types.ObjectId;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  itemType?: 'tutorial' | 'venue' | 'equipment' | 'other';
  itemId?: mongoose.Schema.Types.ObjectId;
  transactionDate: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'transfer'],
      required: [true, 'Transaction type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    itemType: {
      type: String,
      enum: ['tutorial', 'venue', 'equipment', 'other'],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'itemType',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indices for common queries
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema); 