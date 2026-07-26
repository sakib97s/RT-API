import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { VARIATION_LIST } from '../../../schema/sub-schema.schema';
import {
  LocationSchema,
  LanguageItemSchema,
  HighlightSchema,
  IncludeExcludeSchema,
  TextItemSchema,
  FAQSchema,
  TimeSlotSchema,
  ItineraryStopSchema,
  ExtraServiceSchema,
  ParticipantTypeSchema,
  SeasonalDateSchema,
  RecurringDateSchema,
  BookingDateSchema
} from './tour-sub-schemas.schema';

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
    tags: {
      type: [
        {
          _id: {
            type: Schema.Types.ObjectId,
            ref: 'Tag',
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
      ],
      validate: {
        validator: function(v: any[]) {
          return v && v.length > 0;
        },
        message: 'At least one tag is required'
      }
    },
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

    // --- Tour / Experience Specific Fields ---
    productType: { type: String, enum: ['Tour', 'Activity', 'Ticket', 'Transfer', 'Package', 'Event', 'Hotel', 'Rental', 'Custom'], required: false },
    bookingStatus: { type: String, enum: ['Available', 'Limited', 'Sold Out', 'Coming Soon', 'Unavailable'], required: false },
    
    // Cancellation
    freeCancellation: { type: Boolean, required: false, default: false },
    freeCancellationBeforeHours: { type: Number, required: false },
    nonRefundable: { type: Boolean, required: false, default: false },
    partialRefund: { type: Boolean, required: false, default: false },
    refundPercentage: { type: Number, required: false },

    // Schedule
    scheduleType: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Specific Date', 'Custom'], required: false },
    availableDates: { type: [Date], required: false },
    specialDates: { type: [Date], required: false },
    closedDates: { type: [Date], required: false },
    timeSlots: [TimeSlotSchema],
    bookingDates: [BookingDateSchema],

    // Locations
    multipleMeetingPoints: [LocationSchema],
    pickupLocations: [LocationSchema],
    dropLocations: [LocationSchema],
    routeStartLocation: { type: LocationSchema, required: false },
    routeEndLocation: { type: LocationSchema, required: false },

    // Contact & Vendor
    emergencyContact: { type: String, required: false },
    phone: { type: String, required: false },
    email: { type: String, required: false },
    whatsapp: { type: String, required: false },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },
    guideId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },
    operatorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: false },

    // Languages
    languages: [LanguageItemSchema],

    // Basic Tour Info
    durationValue: { type: Number, required: false },
    durationUnit: { type: String, required: false },
    difficulty: { type: String, required: false },
    accessibility: { type: String, required: false },
    pickupAvailable: { type: Boolean, required: false, default: false },
    minimumAge: { type: Number, required: false },
    maximumAge: { type: Number, required: false },
    maximumParticipants: { type: Number, required: false },
    instantConfirmation: { type: Boolean, required: false, default: false },
    mobileTicket: { type: Boolean, required: false, default: false },
    skipTheLine: { type: Boolean, required: false, default: false },
    privateTour: { type: Boolean, required: false, default: false },
    smallGroup: { type: Boolean, required: false, default: false },
    wheelchairAccessible: { type: Boolean, required: false, default: false },
    petFriendly: { type: Boolean, required: false, default: false },
    outdoor: { type: Boolean, required: false, default: false },
    indoor: { type: Boolean, required: false, default: false },

    // Pricing
    priceType: { type: String, enum: ['Per Person', 'Per Group', 'Per Vehicle', 'Per Hour', 'Per Day'], required: false },
    adultPrice: { type: Number, required: false },
    youthPrice: { type: Number, required: false },
    childPrice: { type: Number, required: false },
    infantPrice: { type: Number, required: false },
    seniorPrice: { type: Number, required: false },
    groupPrice: { type: Number, required: false },
    currency: { type: String, required: false },
    taxIncluded: { type: Boolean, required: false, default: false },
    bookingFee: { type: Number, required: false },
    serviceCharge: { type: Number, required: false },
    offerStartDate: { type: Date, required: false },
    offerEndDate: { type: Date, required: false },

    // Inventory
    totalCapacity: { type: Number, required: false },
    remainingCapacity: { type: Number, required: false },
    reservedCapacity: { type: Number, required: false },
    bookedCapacity: { type: Number, required: false },

    // Tour Guide
    guideIncluded: { type: Boolean, required: false, default: false },
    guideName: { type: String, required: false },
    guideType: { type: String, required: false },
    certified: { type: Boolean, required: false, default: false },

    // Media
    thumbnail: { type: String, required: false },
    bannerImage: { type: String, required: false },
    coverImage: { type: String, required: false },
    mapImage: { type: String, required: false },
    highlightImages: { type: [String], required: false },
    videoThumbnail: { type: String, required: false },
    threeSixtyTourUrl: { type: String, required: false },
    audioGuideUrl: { type: String, required: false },
    pdfUploadUrl: { type: String, required: false },
    imageAlt: { type: String, required: false },
    imageCaption: { type: String, required: false },

    // Dynamic Arrays (Rich Nested)
    highlights: [HighlightSchema],
    includes: [IncludeExcludeSchema],
    excludes: [IncludeExcludeSchema],
    importantInfo: [TextItemSchema],
    knowBeforeYouGo: [TextItemSchema],
    faq: [FAQSchema],
    itineraryStops: [ItineraryStopSchema],
    extraServices: [ExtraServiceSchema],

    // Text descriptions
    cancellationPolicy: { type: String, required: false },
    keyFeatures: { type: String, required: false },

    // Settings
    trending: { type: Boolean, required: false, default: false },
    bestSeller: { type: Boolean, required: false, default: false },
    newArrival: { type: Boolean, required: false, default: false },
    recommended: { type: Boolean, required: false, default: false },
    homepage: { type: Boolean, required: false, default: false },
    visible: { type: Boolean, required: false, default: true },
    publish: { type: Boolean, required: false, default: true },
    draft: { type: Boolean, required: false, default: false },
    archived: { type: Boolean, required: false, default: false },

    // Publish Settings
    publishDate: { type: Date, required: false },
    expireDate: { type: Date, required: false },
    schedulePublish: { type: Boolean, required: false, default: false },

    // Booking Settings
    requireBooking: { type: Boolean, required: false, default: false },
    allowMultipleBooking: { type: Boolean, required: false, default: false },
    minimumQuantity: { type: Number, required: false },
    maximumQuantity: { type: Number, required: false },
    bookingNotice: { type: String, required: false },
    availabilityType: { type: String, required: false },
    bookingCutoffTime: { type: String, required: false },
    bookingType: { type: String, enum: ['Instant', 'Request'], required: false, default: 'Instant' },
    bookingCutoff: { type: String, required: false },
    minimumBooking: { type: Number, required: false, default: 1 },
    maximumBooking: { type: Number, required: false },
    bookingWindow: { type: String, required: false },
    advanceBooking: { type: String, required: false },
    bookingConfirmationTime: { type: String, required: false },
    voucherType: { type: String, enum: ['Mobile', 'Printed'], required: false, default: 'Mobile' },
    bookingLanguage: { type: String, required: false },
    bookingNotes: { type: String, required: false },

    // Participant Types & Pricing Engine
    participantTypes: [ParticipantTypeSchema],

    // Extended Date Management
    unavailableDates: { type: [Date], required: false },
    blackoutDates: { type: [Date], required: false },
    seasonalDates: [SeasonalDateSchema],
    recurringDates: [RecurringDateSchema],

    // Experience Attributes
    experienceType: { type: String, required: false },
    familyFriendly: { type: Boolean, required: false, default: false },
    luxury: { type: Boolean, required: false, default: false },

    // Media & Virtual Tour Extensions
    virtualTourUrl: { type: String, required: false },
    threeSixtyImage: { type: String, required: false },
    imageSortOrder: { type: Number, required: false, default: 0 },

    // Analytics
    wishlistCount: { type: Number, required: false, default: 0 },
    shareCount: { type: Number, required: false, default: 0 },
    clickCount: { type: Number, required: false, default: 0 },
    conversionCount: { type: Number, required: false, default: 0 },

    // Workflow
    version: { type: Number, default: 0 },
    workflowStatus: { type: String, enum: ['Draft', 'Pending Review', 'Approved', 'Rejected', 'Published', 'Archived'], required: false },

    // SEO Extras
    autoSyncSeo: { type: Boolean, required: false, default: true },
    metaTitle: { type: String, required: false },
    metaDescription: { type: String, required: false },
    metaKeywords: { type: String, required: false },
    metaUrl: { type: String, required: false },
    ogTitle: { type: String, required: false },
    ogDescription: { type: String, required: false },
    ogImage: { type: String, required: false },
    canonicalUrl: { type: String, required: false },
    robots: { type: String, required: false },
    twitterCard: { type: String, required: false },
    structuredData: { type: String, required: false },

    // Product Relations
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    crossSell: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    upsell: [{ type: Schema.Types.ObjectId, ref: 'Product' }]

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
