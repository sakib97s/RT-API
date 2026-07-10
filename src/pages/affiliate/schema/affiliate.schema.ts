import * as mongoose from 'mongoose';

export const AffiliateSchema = new mongoose.Schema(
  {
    userId: { type: String },
    name: { type: String },
    email: { type: String },
    phoneNo: { type: String },
    status: { type: String, default: 'active' },
    dateString: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
