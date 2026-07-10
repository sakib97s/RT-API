import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SubCategorySchema = new mongoose.Schema(
  {
    
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    
    readOnly: {
      type: Boolean,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    slug: {
      type: String,
      required: false,
    },
    commission: {
      type: Number,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
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
    isSizeChart: {
      type: Boolean,
      required: false,
    },
    sizeChartInImage: {
      type: String,
      required: false,
    },

    sizeChartCnImage: {
      type: String,
      required: false,
    },
    sizeChartFitImage: {
      type: String,
      required: false,
    },
    sizeChartMesImage: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: false,
      default: 'publish',
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
