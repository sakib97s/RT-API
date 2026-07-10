import * as mongoose from 'mongoose';

export const AffiliateReportSchema = new mongoose.Schema(
  {
    type: { type: String },
    affiliate: { type: mongoose.Schema.Types.ObjectId },
    product: { type: mongoose.Schema.Types.ObjectId },
    ownerId: { type: String },
    ownerType: { type: String },
    shopId: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number, default: 0 },
    status: { type: String, default: 'pending' },
    dateString: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
