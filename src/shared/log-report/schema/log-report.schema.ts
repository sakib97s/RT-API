import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const LogReportSchema = new mongoose.Schema(
  {

    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },

    dateString: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    collectionName: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    vendor: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false,
      },
      username: {
        type: String,
        required: false,
      },
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
