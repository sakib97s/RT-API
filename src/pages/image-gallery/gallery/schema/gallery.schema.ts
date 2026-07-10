import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const GallerySchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: false,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    folder: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    extension: {
      type: String,
      required: false,
    },
    size: {
      type: String,
      required: false,
    },
    width: {
      type: String,
      required: false,
    },
    height: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
