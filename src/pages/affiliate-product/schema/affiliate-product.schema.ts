import * as mongoose from 'mongoose';

export const AffiliateProductSchema = new mongoose.Schema(
  {
    name: { type: String },
    ownerId: { type: String },
    ownerType: { type: String },
    url: { type: String },
    description: { type: String },
    price: { type: Number, default: 0 },
    regularPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    image: { type: String },
    status: { type: String, default: 'active' },
    dateString: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
