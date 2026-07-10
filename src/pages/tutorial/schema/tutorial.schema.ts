import * as mongoose from 'mongoose';

export const TutorialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: false,
    },
    keyword: {
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
