import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const NotificationSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: false,
    },

    isRead: {
      type: Boolean,
      required: false,
      default: false,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderStatus: {
      type: Number,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    image: {
      type: String,
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
