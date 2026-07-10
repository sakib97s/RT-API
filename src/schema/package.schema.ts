import * as mongoose from 'mongoose';
import { SPECIFICATION } from './sub-schema.schema';

export const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trip: true,
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
    purchasePrice: {
      type: Number,
      required: false,
      default: 0,
    },
    renewPrice: {
      type: Number,
      required: false,
      default: 0,
    },
    discountType: {
      type: String,
      required: false,
    },
    svgCode: {
      type: String,
      required: false,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    colorCode: {
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
    priority: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    dataLimits: [SPECIFICATION],
    routeLimits: [SPECIFICATION],
    featureLimits: [SPECIFICATION],
    priceTypes: [Object],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

