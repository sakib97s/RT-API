import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SupportSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },

    priority: {
      type: String,
      enum: ['pending', 'low', 'medium', 'high'],
      default: 'medium',
    },

    type: {
      type: String,
      enum: ['issue', 'feedback', 'feature'],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: false,
    },

    shopType: {
      type: String,
      required: false,
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Received',
        'Working On It',
        'Follow Up',
        'Resolved',
        'ReOpen',
      ],
      default: 'Pending',
    },

    images: {
      type: [String],
    },

    assignUser: {
      type: Object,
      required: false,
    },

    resolveDate: {
      type: Date,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
