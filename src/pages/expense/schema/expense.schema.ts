import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ExpenseSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },

    name: {
      type: String,
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
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    invoices: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    urlType: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
      default: 0,
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
