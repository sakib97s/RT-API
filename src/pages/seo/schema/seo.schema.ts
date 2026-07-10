import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SeoSchema = new mongoose.Schema(
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
      unique: true,
    },
    image: {
      type: String,
      required: false,
    },

    pageName: {
      type: String,
      required: false,
    },

    seoDescription: {
      type: String,
      required: false,
    },
    keyWord: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
