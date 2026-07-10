import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const BlogCommentSchema = new mongoose.Schema(
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
      required: false,
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
    blog: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
      },
      title: {
        type: String,
      },
      images: {
        type: [String],
      },
      slug: {
        type: String,
      },
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
    isReview: {
      type: Boolean,
      required: false,
    },
    isComment: {
      type: Boolean,
      required: false,
    },
    rating: {
      type: Number,
      required: false,
    },
    reply: {
      type: String,
      required: false,
    },
    replyDate: {
      type: Date,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: false,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    slug: {
      type: String,
      required: false,
      unique: false,
    },
    images: {
      type: [String],
      required: false,
    },
    description: {
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
