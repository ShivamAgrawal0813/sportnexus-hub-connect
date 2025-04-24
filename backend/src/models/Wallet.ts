import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IWallet extends Document {
  user: IUser['_id'];
  balance: number;
  currency: string;
  transactions: Array<{
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    reference?: string;
    createdAt: Date;
  }>;
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
    transactions: [
      {
        amount: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ['credit', 'debit'],
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
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>('Wallet', WalletSchema); 