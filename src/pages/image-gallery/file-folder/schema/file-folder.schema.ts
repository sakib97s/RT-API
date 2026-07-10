import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const FileFolderSchema = new mongoose.Schema(
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
