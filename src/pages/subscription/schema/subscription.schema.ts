import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { SPECIFICATION } from '../../../schema/sub-schema.schema';

export const SubscriptionSchema = new mongoose.Schema(
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
      features: {
        type: [String],
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
      dataLimits: [SPECIFICATION],
      routeLimits: [SPECIFICATION],
      featureLimits: [SPECIFICATION],
    },
    starDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
