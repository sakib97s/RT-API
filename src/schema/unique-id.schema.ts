import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const UniqueIdSchema = new mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: false,
      default: 0,
    },
    incompleteOrderId: {
      type: Number,
      required: false,
      default: 0,
    },
    invoiceNo: {
      type: Number,
      required: false,
      default: 0,
    },
    purchaseNo: {
      type: Number,
      required: false,
      default: 0,
    },
    transferNo: {
      type: Number,
      required: false,
      default: 0,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);
