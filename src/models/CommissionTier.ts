import { Schema, model, type Document } from 'mongoose';

export interface ICommissionTierDocument extends Document {
  name: string;
  priceLabel: string;
  detailTag: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionTierSchema = new Schema<ICommissionTierDocument>(
  {
    name: {
      type: String,
      required: [true, 'Tier name is required'],
      trim: true,
      maxlength: [100, 'Tier name cannot exceed 100 characters'],
    },
    priceLabel: {
      type: String,
      required: [true, 'Price label is required'],
      trim: true,
      maxlength: [50, 'Price label cannot exceed 50 characters'],
    },
    detailTag: {
      type: String,
      required: [true, 'Detail tag is required'],
      trim: true,
      maxlength: [100, 'Detail tag cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'commissiontiers',
  },
);

export const CommissionTier = model<ICommissionTierDocument>('CommissionTier', CommissionTierSchema);
