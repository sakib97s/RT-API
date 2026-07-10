import * as mongoose from 'mongoose';

export const PortSchema = new mongoose.Schema(
  {
    port: {
      type: Number,
      required: true,
      unique: true,
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

