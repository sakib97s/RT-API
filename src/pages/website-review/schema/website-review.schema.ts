import * as mongoose from 'mongoose';

export const WebsiteReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameEn: {
      type: String,
      required: false,
      trim: false,
    },
    images: {
      type: [String],
      required: false,
    },
    websiteLink: {
      type: String,
      required: false,
    },
    facebookLink: {
      type: String,
      required: false,
    },
    review: {
      type: String,
      required: false,
    },
    reviewEn: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
    },
     rating: {
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
