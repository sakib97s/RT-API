import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { USER_ADDRESS } from '../../../schema/sub-schema.schema';

export const UserSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
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
    phoneNo: {
      type: String,
      required: false,
    },
    countryCode: {
      type: String,
      required: false,
    },
    fullPhoneNo: {
      type: String,
      required: false,
    },
    email: {
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
    hasAccess: {
      type: Boolean,
      required: true,
    },
    registrationAt: {
      type: String,
      required: false,
    },
    lastLoggedIn: {
      type: Date,
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
    addresses: [
      {
        type: USER_ADDRESS,
        required: false,
      },
    ],
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
