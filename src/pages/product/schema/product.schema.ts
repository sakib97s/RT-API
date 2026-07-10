import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { VARIATION_LIST } from '../../../schema/sub-schema.schema';

export const ProductSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
    },
    autoSlug: {
      type: Boolean,
      required: false,
    },
    category: [
      {
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
        images: {
          type: [String],
          required: false,
        },
      },
    ],
    subCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
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
    childCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ChildCategory',
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
    brand: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
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
    tags: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'Tag',
          required: false,
        },
        name: {
          type: String,
          required: false,
        },
      },
    ],
    images: {
      type: [String],
      required: false,
    },
    testimonialImages: {
      type: [String],
      required: false,
    },
    isCustomProduct: {
      type: Boolean,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    productCondition: {
      type: Boolean,
      required: false,
    },
    seoDescription: {
      type: String,
      required: false,
    },
    seoKeyword: {
      type: String,
      required: false,
    },
    seoTitle: {
      type: String,
      required: false,
    },
    keyFeature: {
      type: String,
      required: false,
    },
    isEnablePhoneModel: {
      type: Boolean,
      required: false,
    },
    skinType: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'SkinType',
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
    skinConcern: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'SkinConcern',
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

    sku: {
      type: String,
      required: false,
    },
    unit: {
      type: String,
      required: false,
    },
    keyWord: {
      type: [String],
      required: false,
    },
    warranty: {
      type: String,
      required: false,
    },
    weight: {
      type: Number,
      required: false,
    },
    model: {
      type: String,
      required: false,
    },
    month: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: false,
    },
    shortDescription: {
      type: String,
      required: false,
    },
    specifications: {
      type: [],
      required: false,
    },
    driveLinks: {
      type: [],
      required: false,
    },
    costPrice: {
      type: Number,
      required: false,
    },
    salePrice: {
      type: Number,
      required: false,
    },
    regularPrice: {
      type: Number,
      required: false,
    },
    discountType: {
      type: String,
      required: false,
    },
    discountAmount: {
      type: Number,
      required: false,
    },
    // deliveryCharge: {
    //   type: Number,
    //   required: false,
    //   default: 0,
    // },
    deliveryCharge: {
      insideCity: {
        type: Number,
        required: false,
        default: 0,
      },
      outsideCity: {
        type: Number,
        required: false,
        default: 0,
      },

      isEnableDeliveryCharge: {
        type: Boolean,
        required: false,
      },

    },
    advancePayment: {
      type: Number,
      required: false,
      default: 0,
    },
    quantity: {
      type: Number,
      required: false,
      default: 0,
    },
    isCentralProduct: {
      type: Boolean,
      required: false,
      default: false,
    },

    minimumWholesaleQuantity: {
      type: Number,
      required: false,
      default: 0,
    },
    maximumWholesaleQuantity: {
      type: Number,
      required: false,
      default: 0,
    },
    wholesalePrice: {
      type: Number,
      required: false,
      default: 0,
    },

    isWholesale: {
      type: Boolean,
      required: false,
    },
    wholesaleUnit: {
      type: String,
      required: false,
    },
    isFacebookCatalog: {
      type: Boolean,
      required: false,
    },
    isAffiliateProduct: {
      type: Boolean,
      required: false,
    },
    totalSold: {
      type: Number,
      required: false,
      default: 0,
    },
    totalView: {
      type: Number,
      required: false,
      default: 0,
    },
    ratingCount: {
      type: Number,
      required: false,
      default: 0,
    },
    ratingTotal: {
      type: Number,
      required: false,
      default: 0,
    },
    reviewTotal: {
      type: Number,
      required: false,
      default: 0,
    },
    ratingDetails: {
      oneStar: {
        type: Number,
        default: 0,
      },
      twoStar: {
        type: Number,
        default: 0,
      },
      threeStar: {
        type: Number,
        default: 0,
      },
      fourStar: {
        type: Number,
        default: 0,
      },
      fiveStar: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    dateString: {
      type: String,
      required: false,
    },
    affiliatePrice: {
      type: Number,
      default: 0,
    },
    affiliateUrl: {
      type: String,
      required: false,
    },
    affiliateDescription: {
      type: String,
      required: false,
    },
    isVariation: {
      type: Boolean,
      required: false,
    },
    variation: {
      type: String,
      required: false,
    },
    variationOptions: {
      type: [],
      required: false,
    },
    variation2: {
      type: String,
      required: false,
    },
    variation2Options: {
      type: [],
      required: false,
    },
    variationList: [VARIATION_LIST],

    affiliateProduct: {
      type: Schema.Types.ObjectId,
      ref: 'AffiliateProduct',
      required: false,
    },
    faqList: {
      type: [Object],
      required: false,
    },
    faqTitle: {
      type: String,
      required: false,
    },

    // External sync (optional)
    external: {
      source: { type: String }, // e.g., 'mohasagor'
      id: { type: String }, // client product id (string)
      productCode: { type: String },
      lastHash: { type: String },
      lastSyncedAt: { type: Date },
    },
    // Low Stock Alert
    lowStockThreshold: {
      type: Number,
      default: 10,
      required: false,
    },
    // Expiry Date (for medicine, grocery)
    expiryDate: {
      type: Date,
      required: false,
    },
    expiryDateString: {
      type: String,
      required: false,
    },
    // Batch Management
    batchNumber: {
      type: String,
      required: false,
    },
    batchDate: {
      type: Date,
      required: false,
    },
    // Barcode
    barcode: {
      type: String,
      required: false,
    },
    // Product Policies
    returnPolicy: {
      type: String,
      required: false,
    },
    exchangePolicy: {
      type: String,
      required: false,
    },
    deliveryTime: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// 🔹 Partial Unique Index (শুধু external.id থাকলে ইউনিক)
ProductSchema.index(
  { shop: 1, 'external.source': 1, 'external.id': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'external.id': { $exists: true, $type: 'string' },
    },
  },
);
