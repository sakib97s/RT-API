import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const UniqueUserIdSchema = new mongoose.Schema(
  {

    userId: {
      type: Number,
      required: false,
      default: 0,
    },

  },
  {
    versionKey: false,
    timestamps: false,
  },
);
