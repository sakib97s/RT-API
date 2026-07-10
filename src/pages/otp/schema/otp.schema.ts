import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const OtpSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: false,
    },
    code: {
      type: String,
      required: true,
    },
    expireTime: {
      type: String,
      required: false,
    },
    count: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: false, updatedAt: true },
  },
);
