const mongoose = require('mongoose');
const Schema = mongoose.Schema;

export const ReviewSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    user: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
      },
      profileImg: {
        type: String,
      },
    },

    product: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: {
        type: String,
      },
      images: {
        type: [String],
      },
      slug: {
        type: String,
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
      regularPrice: {
        type: Number,
        required: false,
      },
      discountType: {
        type: String,
        required: false,
      },
      quantity: {
        type: Number,
        required: false,
        default: 0,
      },
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    reviewDate: {
      type: Date,
      required: false,
      default: Date.now(),
    },
    review: {
      type: String,
      required: true,
    },

    orderId: {
      type: String,
      required: false,
    },
    order_Id: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    reviewBy: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      required: true,
    },

    deliveryExperienceRating: {
      type: Number,
      required: false,
    },
    status: {
      type: Boolean,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    reply: {
      type: String,
      required: false,
    },
    deliveryExperience: {
      type: String,
      required: false,
    },

    images: [
      {
        type: String,
        required: false,
      },
    ],

    replyDate: {
      type: Date,
      required: false,
    },
    like: {
      type: Number,
      required: false,
    },
    dislike: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
