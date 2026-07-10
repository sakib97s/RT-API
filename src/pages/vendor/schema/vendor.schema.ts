import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const VendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    isPasswordLess: {
      type: Boolean,
      required: true,
    },
    password: {
      type: String,
      required: false,
    },
    registrationType: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: false,
    },
    profileBanner: {
      type: String,
      required: false,
    },
    countryCode: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      required: false,
    },
    profileImg: {
      type: String,
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
    registrationAt: {
      type: String,
      required: false,
    },
    lastLoggedIn: {
      type: Date,
      required: false,
    },
    pages: {
      type: String,
      required: false,
    },
    failedLoginCount: {
      type: Number,
      required: false,
    },
    failedLoginStartTime: {
      type: Date,
      required: false,
    },
    shops: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'Shop',
          required: false,
        },
        role: {
          type: String,
          required: false,
        },
        pages: {
          type: [String],
          required: false,
        },
        permissions: {
          type: [String],
          required: false,
        },
      },
    ],
    role: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
