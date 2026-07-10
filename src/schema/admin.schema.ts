import * as mongoose from 'mongoose';

export const AdminSchema = new mongoose.Schema(
  {
    readOnly: {
      type: Boolean,
      required: false,
    },
    isChat: {
      type: Boolean,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
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
    gender: {
      type: String,
      required: false,
    },
    profileImg: {
      type: String,
    },
    hasAccess: {
      type: Boolean,
      required: true,
    },
    affiliateAccess: {
      type: Boolean,
      required: false,
      default: true,
    },
    role: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
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

    // Affiliate status tracking
    affiliateStatusList: [
      {
        affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },
        status: {
          type: String,
          enum: ['approved', 'blocked', 'pending'],
          default: 'pending',
        },
        note: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    security: {
      failedCount: { type: Number, default: 0 },
      lockUntil: { type: Date },
      devices: [
        {
          deviceId: String,
          userAgent: String,
          ip: String,
          firstSeen: Date,
          lastSeen: Date,
        },
      ],
      twoFactorEnabled: { type: Boolean, default: true },
      passwordReset: {
        codeHash: { type: String },
        expiresAt: { type: Date },
        attempts: { type: Number, default: 0 },
      },
    },

    // Payment settings
    paymentInstructions: {
      type: String,
      required: false,
    },
    minWithdrawAmount: { type: Number, required: false, default: 0 },
    passwordChangedAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

