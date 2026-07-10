import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const TransferHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: false,
    },

    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    dateString: {
      type: String,
      required: false,
    },

    time: {
      type: String,
      required: false,
    },
    vendor: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
      },
      username: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      phoneNo: {
        type: String,
        required: false,
      },
      shopName: {
        type: String,
        required: false,
      },
    },

    payable: {
      type: Number,
      required: false,
    },
    subTotal: {
      type: Number,
      required: false,
    },
    paid: {
      type: Number,
      required: false,
    },
    commission: {
      type: Number,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
