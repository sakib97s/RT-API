import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { ORDER_ITEM_SCHEMA } from '../../../schema/sub-schema.schema';

export const TempOrderSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    isAdvancePayment: {
      type: Boolean,
      required: false,
      default: false,
    },
    carts: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Carts',
          required: false,
        },
      ],
    },
    name: {
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
    division: {
      type: String,
      required: false,
    },
    area: {
      type: String,
      required: false,
    },
    zone: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      required: false,
    },
    shippingAddress: {
      type: String,
      required: false,
    },

    providerName: {
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

    paymentStatus: {
      type: String,
      required: false,
    },
    paymentType: {
      type: String,
      required: false,
    },
    orderStatus: {
      type: String,
      required: false,
    },
    trashDate: {
      type: String,
      required: false,
    },
    subTotal: {
      type: Number,
      required: false,
    },
    discount: {
      type: Number,
      required: false,
    },
    grandTotal: {
      type: Number,
      required: false,
    },

    deliveryCharge: {
      type: Number,
      required: false,
    },

    offerDiscount: {
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
      offerType: {
        type: String,
        required: false,
      },
    },

    paymentMethod: {
      type: String,
      required: false,
    },
    paymentApiType: {
      type: String,
      required: false,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentApiTrxID: {
      type: String,
      required: false,
    },
    paidAmount: {
      type: Number,
      required: false,
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: false,
    },
    couponDiscount: {
      type: Number,
      required: false,
    },

    // advancePayment: {
    //   type: Number,
    //   required: false,
    // },
    // productDiscount: {
    //   type: Number,
    //   required: false,
    // },
    checkoutDate: {
      type: String,
      required: false,
    },
    checkoutTime: {
      type: String,
      required: false,
    },
    deliveryNote: {
      type: String,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    orderedItems: [ORDER_ITEM_SCHEMA],

    orderedFrom: {
      type: String,
      required: false,
    },
    cancelReason: {
      type: String,
      required: false,
    },
    deliveryType: {
      type: String,
      required: false,
    },
    deliveryDate: {
      type: String,
      required: false,
    },
    deliveryTime: {
      type: String,
      required: false,
    },
    orderTimeline: {
      pending: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      confirmed: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      processing: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      shipped: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      delivered: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      cancelled: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      returned: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      refunded: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
    },
    courierData: {
      providerName: {
        type: String,
        required: false,
      },
      consignmentId: {
        type: String,
        required: false,
      },
      trackingId: {
        type: String,
        required: false,
      },
    },
    orderType: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    adjustProductQuantity: {
      type: Boolean,
      required: false,
    },
    // status: {
    //   type: String,
    //   required: false,
    // },
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
