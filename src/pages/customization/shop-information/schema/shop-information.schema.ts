import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ShopInformationSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    websiteName: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    headerNews: {
      type: String,
      required: false,
    },
    reviewSubtitle: {
      type: String,
      required: false,
    },
    reviewTitle: {
      type: String,
      required: false,
    },
    reviewDescription: {
      type: String,
      required: false,
    },
    poweredby: {
      type: String,
      required: false,
    },
    isShow: {
      type: Boolean,
      required: false,
      default: true,
    },
    downloadAppDescription: {
      type: String,
      required: false,
    },
    siteLogo: {
      type: String,
      required: false,
    },
    isShowNewsSlider: {
      type: Boolean,
      required: false,
    },
    navLogo: {
      type: String,
      required: false,
    },
    isShowHeaderCategoryMenu: {
      type: Boolean,
      required: false,
    },
    fabIcon: {
      type: String,
      required: false,
    },
    logoPrimary: {
      type: String,
      required: false,
    },
    footerLogo: {
      type: String,
      required: false,
    },
    othersLogo: {
      type: String,
      required: false,
    },
    addresses: [
      {
        type: Object,
        required: false,
      },
    ],
    emails: [
      {
        type: Object,
        required: false,
      },
    ],
    phones: [
      {
        type: Object,
        required: false,
      },
    ],
    whatsappNumber: {
      type: String,
      required: false,
    },
    downloadUrls: [
      {
        type: Object,
        required: false,
      },
    ],
    socialLinks: [
      {
        type: Object,
        required: false,
      },
    ],
    showBranding: {
      type: Boolean,
      required: false,
    },
    brandingText: {
      type: String,
      required: false,
    },
    showCopyright: {
      type: Boolean,
      required: false,
    },
    headerBgColor: {
      type: String,
      required: false,
    },
    headerBgTextColor: {
      type: String,
      required: false,
    },
    headerBgTextHoverColor: {
      type: String,
      required: false,
    },
    footerBgColor: {
      type: String,
      required: false,
    },
    footerBgTextHoverColor: {
      type: String,
      required: false,
    },
    footerTextColor: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
