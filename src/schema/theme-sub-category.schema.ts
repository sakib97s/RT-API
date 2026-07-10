import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ThemeSubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: true,
    },
    themeCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ThemeCategory',
        required: true,
      },
      name: {
        type: String,
        required: false,
      },
      slug: {
        type: String,
        required: false,
      },
    },
    image: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
      default: 'draft',
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    searchHints: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

