import * as mongoose from 'mongoose';

export interface AdminSession extends mongoose.Document {
  adminId: mongoose.Types.ObjectId;
  userAgent?: string;
  ip?: string;
  refreshTokenHash: string; // bcrypt hash of opaque token
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  revokedBy?: mongoose.Types.ObjectId | null; // admin who revoked
  reason?: string | null;
}

export const AdminSessionSchema = new mongoose.Schema<AdminSession>(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    userAgent: { type: String },
    ip: { type: String },
    refreshTokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reason: { type: String, default: null },
  },
  { versionKey: false, timestamps: false },
);

AdminSessionSchema.index({ adminId: 1, revokedAt: 1 });
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index (auto-purge after expiresAt)
