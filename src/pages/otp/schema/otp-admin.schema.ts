import * as mongoose from 'mongoose';

export const OtpAdminSchema = new mongoose.Schema(
  {
    phoneNo: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      required: false,
    },
    code: {
      type: String,
      required: true,
    },
    expireTime: {
      type: String,
      required: false,
    },
    count: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: false, updatedAt: true },
  },
);
