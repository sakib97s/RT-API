import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ChildCategorySchema = new mongoose.Schema(
  {

    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
   
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    images: {
      type: [String],
      required: false,
    },
    commission: {
      type: Number,
      required: false,
    },
    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
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
    subCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: false,
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
    status: {
      type: String,
      required: false,
      default: 'publish',
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
