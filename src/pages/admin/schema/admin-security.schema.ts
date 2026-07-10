import * as mongoose from 'mongoose';

/**
 * Single collection to store:
 *  - attempt   : login attempts
 *  - ip_block  : ip temporary block
 *  - twofactor : pending 2FA codes
 */

const AdminSecuritySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ['attempt', 'ip_block', 'twofactor'],
      index: true,
    },

    // Common meta (optional per kind)
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // for twofactor
    adminUsername: { type: String }, // for attempt
    ip: { type: String, index: true },
    userAgent: { type: String },

    // ===== attempt fields =====
    success: { type: Boolean },             // attempt only
    reason: { type: String },               // attempt only
    createdAt: { type: Date, default: Date.now }, // attempt timestamp

    // ===== ip_block fields =====
    blockedUntil: { type: Date },           // ip_block only

    // ===== twofactor fields =====
    codeHash: { type: String },             // twofactor only (bcrypt hash)
    expiresAt: { type: Date },              // twofactor only
    attempts: { type: Number, default: 0 }, // twofactor only
    consumedAt: { type: Date },             // twofactor only
  },
  { versionKey: false, timestamps: true }
);

/** Index recommendations */
AdminSecuritySchema.index({ kind: 1, createdAt: -1 });
AdminSecuritySchema.index({ kind: 1, adminUsername: 1, createdAt: -1 });
AdminSecuritySchema.index({ kind: 1, ip: 1 });
AdminSecuritySchema.index({ kind: 1, expiresAt: 1 }); // for twofactor queries

export { AdminSecuritySchema };
