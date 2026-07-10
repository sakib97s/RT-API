import * as mongoose from 'mongoose';
import { Schema, Types } from 'mongoose';

export const PaymentLinkHistorySchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
      required: false,

    },
    dateString: {
      type: String,
      required: false,
    },
    reference: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    paymentLinkId: {
      type: String,
      required: false,
    },

  },
  {
    versionKey: false,
    timestamps: true,
  },
);
