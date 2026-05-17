import { Schema, model, type Document } from 'mongoose';

export type TosVariant = 'default' | 'prohibited' | 'info';

export interface ITosSectionDocument extends Document {
  heading: string;
  variant: TosVariant;
  points: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const TosSectionSchema = new Schema<ITosSectionDocument>(
  {
    heading: {
      type: String,
      required: [true, 'Section heading is required'],
      trim: true,
      maxlength: [200, 'Heading cannot exceed 200 characters'],
    },
    variant: {
      type: String,
      enum: {
        values: ['default', 'prohibited', 'info'],
        message: 'Variant must be one of: default, prohibited, info',
      },
      default: 'default',
    },
    points: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'At least one point is required',
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tossections',
  },
);

export const TosSection = model<ITosSectionDocument>('TosSection', TosSectionSchema);
