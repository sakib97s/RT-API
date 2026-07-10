import * as mongoose from 'mongoose';

export const AnnouncementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },

    priority: {
      type: Number,
      required: false,
      default: 0,
    },
    description: {
      type: String,
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
