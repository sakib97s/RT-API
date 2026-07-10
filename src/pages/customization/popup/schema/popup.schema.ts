import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const PopupSchema = new mongoose.Schema(
  {

    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },


    readOnly: {
      type: Boolean,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },

    slug: {
      type: String,
      required: false,
      unique: false,
    },
    type: {
      type: String,
      required: false,
    },
    urlType: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },

    images: {
      type: [String],
      required: false,
    },
    description: {
      type: String,
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
    deleteDateString: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
