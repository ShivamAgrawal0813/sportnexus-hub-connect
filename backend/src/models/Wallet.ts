import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IWallet extends Document {
  user: IUser['_id'];
  balance: number;
  currency: string;
  transactions: Array<{
    amount: number;
    type: 'credit' | 'debit' | 'conversion';
    description: string;
    reference?: string;
    createdAt: Date;
    metadata?: {
      originalAmount?: number;
      originalCurrency?: string;
      [key: string]: any;
    };
  }>;
  metadata?: {
    originalUsdBalance?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    metadata: {
      type: Object,
      default: {},
    },
    transactions: [
      {
        amount: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ['credit', 'debit', 'conversion'],
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        reference: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: Object,
          default: {},
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>('Wallet', WalletSchema); 