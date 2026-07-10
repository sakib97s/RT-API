import * as mongoose from 'mongoose';

export const RewardSchema = new mongoose.Schema(
  {
    rewardPoint: {
      type: Number,
      required: false,
    },
    rewardValue: {
      type: Number,
      required: false,
    },
    rewardWithdrawAmount: {
      type: Number,
      required: false,
    },
    rewardWithdrawPurchaseAmount: {
      type: Number,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
