import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SubscriptionReportSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    package: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
      price: {
        type: Number,
        required: false,
      },
      discountType: {
        type: String,
        required: false,
      },
      discountAmount: {
        type: Number,
        required: false,
      },
      renewInDay: {
        type: Number,
        required: false,
      },
    },
    starDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    renewDate: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    reference: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
