import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const CartSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSelected: {
      type: Boolean,
      required: false,
    },
    isWholesale: {
      type: Boolean,
      required: false,
    },
    selectedQty: {
      type: Number,
      required: true,
    },
    phoneModel: {
      type: String,
      required: false,
    },
    variation: {
      _id: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      option: {
        type: String,
        required: false,
      },
      sku: {
        type: String,
        required: false,
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
