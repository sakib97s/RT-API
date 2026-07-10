import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SkinTypeSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    discount: {
      type: Number,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
