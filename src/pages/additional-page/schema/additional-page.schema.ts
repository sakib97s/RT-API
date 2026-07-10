import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const AdditionalPageSchema = new mongoose.Schema(
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
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionIt: {
      type: String,
      required: false,
    },
    isHtml: {
      type: Boolean,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
