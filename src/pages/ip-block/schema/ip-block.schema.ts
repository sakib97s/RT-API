import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const IpBlockSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    userIpAddress: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },

    dateString: {
      type: String,
      required: false,
    },
    blockUntil: {
      type: Date,
      required: false,
    },

    month: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
