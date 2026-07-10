import * as mongoose from 'mongoose';

export const PreShopSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    shopType: {
      type: String,
      required: false,
    },
    themeId: {
      type: String,
      required: false,
    },
    packageId: {
      type: String,
      required: false,
    },
    trialPeriod: {
      type: Number,
      required: false,
      default: 0,
    },
    dateString: {
      type: String,
      required: false,
    },
    amount: {
      type: Number,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    websiteBuildStatus: {
      type: String,
      required: false,
    },

    affiliateId: {
      type: String,
      required: false,
    },
    affiliateProductId: {
      type: String,
      required: false,
    },

    countryCode: {
      type: String,
      required: false,
      default: 'BD',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
