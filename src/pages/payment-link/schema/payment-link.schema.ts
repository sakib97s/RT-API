import * as mongoose from 'mongoose';
import { Schema, Types } from 'mongoose';

export const PaymentLinkSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: false,

    },
    image: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },


    description: {
      type: String,
      required: false,
    },

    url: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
    },

  },
  {
    versionKey: false,
    timestamps: true,
  },
);
