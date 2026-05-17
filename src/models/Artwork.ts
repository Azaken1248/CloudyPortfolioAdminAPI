import { Schema, model, type Document } from 'mongoose';

export interface IArtworkDocument extends Document {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArtworkSchema = new Schema<IArtworkDocument>(
  {
    title: {
      type: String,
      required: [true, 'Artwork title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Artwork category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Artwork description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    altText: {
      type: String,
      required: [true, 'Alt text is required for accessibility'],
      trim: true,
      maxlength: [500, 'Alt text cannot exceed 500 characters'],
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'artworks',
  },
);

export const Artwork = model<IArtworkDocument>('Artwork', ArtworkSchema);
