import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import {
  THEME_CUSTOM_OPTION,
  THEME_PAGE_CUSTOM_OPTION,
} from './sub-schema.schema';

export const ThemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trip: true,
    },
    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ThemeCategory',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      slug: {
        type: String,
        required: false,
      },
    },
    subCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ThemeSubCategory',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      slug: {
        type: String,
        required: false,
      },
    },
    sourcePath: {
      type: String,
      required: false,
    },
    targetPath: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    pdf: {
      type: String,
      required: false,
    },
    previewLink: {
      type: String,
      required: false,
    },
    version: {
      type: String,
      required: false,
    },
    demoUrl: {
      type: String,
      required: false,
    },
    themeTitle: {
      type: String,
      required: false,
    },
    gitHubLink: {
      type: String,
      required: false,
    },
    forceUpdate: {
      type: Boolean,
      required: false,
      default: false,
    },
    pm2path: {
      type: String,
      required: false,
    },
    hostDomain: {
      type: String,
      required: false,
    },
    availability: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },

    themeStatus: {
      type: String,
      required: false,
    },

    reference: {
      type: String,
      required: false,
    },
    releaseNote: {
      type: String,
      required: false,
    },

    themePrice: {
      type: Number,
      required: false,
    },
    totalInstalled: {
      type: Number,
      required: false,
      default: 0,
    },
    themeCustomOptions: [THEME_CUSTOM_OPTION],
    pageCustomOptions: [THEME_PAGE_CUSTOM_OPTION],
    priority: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

