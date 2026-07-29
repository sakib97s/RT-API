import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import {
  ADVANCE_PAYMENT_SETTING,
  CHAT_SETTING,
  COURIER_METHOD_SETTING,
  DELIVERY_CHARGE_SETTING,
  DOMAIN_SETTING,
  EPBX_SETTING,
  FRAUD_CHECK_SETTING,
  OFFER_SETTING,
  PAGE_VIEW_SETTING,
  PAYMENT_METHOD_SETTING,
  SMS_METHOD_SETTING,
  SOCIAL_LOGIN_SETTING,
  THEME_VIEW_SETTING,
} from '../../../../schema/sub-schema.schema';

export const SettingSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    analytics: {
      tagManagerId: {
        type: String,
        required: false,
      },
      facebookPixelId: {
        type: String,
        required: false,
      },
      facebookPixelAccessToken: {
        type: String,
        required: false,
      },
      IsManageFbPixelByTagManager: {
        type: Boolean,
        required: false,
      },
      isEnablePixelTestEvent: {
        type: Boolean,
        required: false,
      },
      facebookPixelTestEventId: {
        type: String,
        required: false,
      },
      // TikTok Pixel Settings
      tiktokPixelId: {
        type: String,
        required: false,
      },
      tiktokAccessToken: {
        type: String,
        required: false,
      },
      tiktokTestEventCode: {
        type: String,
        required: false,
      },
      isPurchaseEventOnConfirm: {
        type: Boolean,
        required: false,
      },
      // Custom Third-Party Tag Manager
      customTagManagerId: {
        type: String,
        required: false,
      },
    },
    isCashOnDeliveryOff: {
      type: Boolean,
      required: false,
    },
    facebookCatalog: {
      isEnableFacebookCatalog: {
        type: Boolean,
        required: false,
      },
    },
    bizmation: {
      isEnable: {
        type: Boolean,
        required: false,
        default: false,
      },
      inventoryId: {
        type: Number,
        required: false,
      },
      apiAccessToken: {
        type: String,
        required: false,
      },
    },
    orderSetting: {
      isEnableOrderNote: {
        type: Boolean,
        required: false,
      },
      isEnableCheckoutOrderModal: {
        type: Boolean,
        required: false,
      },
      isEnablePrescriptionOrder: {
        type: Boolean,
        required: false,
      },
      successPageMessage: {
        type: String,
        required: false,
      },
      isEnableOrderSuccessPageOrderId: {
        type: Boolean,
        required: false,
      },
      isEnableOtp: {
        type: Boolean,
        required: false,
        default: false,
      },

      isProductSkuEnable: {
        type: Boolean,
        required: false,
      },
      isEnableCheckoutMessage: {
        type: Boolean,
        required: false,
      },
      checkoutMessage: {
        type: String,
        required: false,
      },
      isSLEnable: {
        type: Boolean,
        required: false,
        default: true,
      },
      isEnableHomeRecentOrder: {
        type: Boolean,
        required: false,
      },
      isSwapPaymentAndOrderItem: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePreviousOrderCount: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableSingleIpBlock: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableIpWiseOrderLimitAndBlockTime: {
        type: Boolean,
        required: false,
        default: false,
      },
      ipWiseOrderBlockTime: {
        type: Number,
        required: false,
      },
      ipWiseOrderLimit: {
        type: Number,
        required: false,
      },
      isEnableDashboardProfit: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableHrm: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductDetailsWhatsAppOrder: {
        type: Boolean,
        required: false,
        default: true,
      },
      isEnableProductDetailsCallOrder: {
        type: Boolean,
        required: false,
        default: true,
      },
      isEnableItalyStateWiseOrder: {
        type: Boolean,
        required: false,
        default: false,
      },
      selectedItalyStates: {
        type: [String],
        required: false,
        default: [],
      },
      isEnableCustomOrderStatus: {
        type: Boolean,
        required: false,
        default: false,
      },
      selectedSystemStatuses: {
        type: [String],
        required: false,
        default: [],
      },
      customOrderStatuses: [
        {
          value: { type: String, required: false },
          label: { type: String, required: false },
        }
      ],
    },
    orderPhoneValidation: {
      isEnableOutsideBd: {
        type: Boolean,
        required: false,
      },
      maxLength: {
        type: Number,
        required: false,
      },
      minLength: {
        type: Number,
        required: false,
      },
    },
    orderNotification: {
      isEnableSMSNotification: {
        type: Boolean,
        required: false,
      },
      isEnableEmailNotification: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePersonalNotification: {
        type: Boolean,
        required: false,
        default: false,
      },
      appEmail: {
        type: String,
        required: false,
      },
      appPassword: {
        type: String,
        required: false,
      },
    },
    incompleteOrder: {
      isEnableIncompleteOrder: {
        type: Boolean,
        required: false,
      },
    },

    affiliate: {
      isAffiliate: {
        type: Boolean,
        required: false,
      },
    },
    blog: {
      isEnableBlog: {
        type: Boolean,
        required: false,
      },
    },
    deliveryOptionType: {
      isEnableDivision: {
        type: Boolean,
        required: false,
      },
      isEnableInsideCityOutsideCity: {
        type: Boolean,
        required: false,
      },
      isEnableInsideCitySubAreaOutsideCity: {
        type: Boolean,
        required: false,
      },
      isEnableDistrict: {
        type: Boolean,
        required: false,
      },
      deliveryOptionTitle: {
        type: String,
        required: false,
      },
      insideCityText: {
        type: String,
        required: false,
      },
      outsideCityText: {
        type: String,
        required: false,
      },
      subAreaText: {
        type: String,
        required: false,
      },
    },
    invoiceSetting: {
      selectedInvoice: {
        type: String,
        required: false,
        default: 'invoice1',
      },
      isEnableInvoiceCourierId: {
        type: Boolean,
        required: false,
      },
      isDisableInvoicePriceSection: {
        type: Boolean,
        required: false,
      },
    },
    productSetting: {
      productType: {
        type: String,
        required: false,
      },
      checkoutType: {
        type: String,
        required: false,
      },
      urlType: {
        type: String,
        required: false,
      },
      isEnableSoldQuantitySort: {
        type: Boolean,
        required: false,
      },
      isEnableDoublePrice: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePrioritySort: {
        type: Boolean,
        required: false,
      },
      isEnableUserNotification: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePhoneModel: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductKeyFeature: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductFaq: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductCallOrderBtn: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductTestimonial: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePreOrder: {
        type: Boolean,
        required: false,
        default: false,
      },
      isShowCategoryOnHomePage: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductDetailsView: {
        type: Boolean,
        required: false,
      },
      isEnableAdvancePayment: {
        type: Boolean,
        required: false,
      },
      isEnableDeliveryCharge: {
        type: Boolean,
        required: false,
      },
      isEnableServiceReservation: {
        type: Boolean,
        required: false,
      },
      isHideCostPrice: {
        type: Boolean,
        required: false,
      },
      isManagePhysicalStock: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableProductCondition: {
        type: Boolean,
        required: false,
      },
      digitalProduct: {
        isEmailEnable: {
          type: Boolean,
          required: false,
        },
        isAddressEnable: {
          type: Boolean,
          required: false,
        },
        isDivisionEnable: {
          type: Boolean,
          required: false,
        },
      },

      isCampaignEnable: {
        type: Boolean,
        required: false,
      },
      isDisabledBrand: {
        type: Boolean,
        required: false,
      },

      isEnablePCBuilder: {
        type: Boolean,
        required: false,
      },
      isEnableService: {
        type: Boolean,
        required: false,
      },
      isEnableResell: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnablePortfolio: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableUnder99Offer: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableMultipleCategory: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableTotalSold: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnable3VariationSystem: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    deliveryCharges: [DELIVERY_CHARGE_SETTING],
    paymentMethods: [PAYMENT_METHOD_SETTING],
    advancePayment: [ADVANCE_PAYMENT_SETTING],
    smsMethods: [SMS_METHOD_SETTING],
    courierMethods: [COURIER_METHOD_SETTING],
    themeViewSettings: [THEME_VIEW_SETTING],
    pageViewSettings: [PAGE_VIEW_SETTING],
    socialLogins: [SOCIAL_LOGIN_SETTING],
    offers: [OFFER_SETTING],
    chats: [CHAT_SETTING],
    domains: [DOMAIN_SETTING],
    currency: {
      name: {
        type: String,
        required: false,
      },
      code: {
        type: String,
        required: false,
      },
      symbol: {
        type: String,
        required: false,
      },
      countryCode: {
        type: String,
        required: false,
      },
    },
    country: {
      name: {
        type: String,
        required: false,
      },
      code: {
        type: String,
        required: false,
      },
    },
    marketCode: {
      type: String,
      required: false,
      default: 'BD',
      trim: true,
    },
    locale: {
      type: String,
      required: false,
      default: 'bn',
      trim: true,
    },
    taxSettings: {
      enabled: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    shippingModel: {
      type: String,
      required: false,
      default: 'inside-outside-city',
      trim: true,
    },
    searchHints: {
      type: String,
      required: false,
    },
    orderLanguage: {
      type: String,
      required: false,
    },
    dashboardStyle: {
      type: String,
      required: false,
      default: 'professional',
    },
    homePageSettings: {
      type: Schema.Types.Mixed,
      required: false,
    },
    productControlStyle: {
      type: String,
      required: false,
      default: 'professional',
    },
    googleSearchConsoleToken: {
      type: String,
      required: false,
    },
    themeColors: {
      primary: {
        type: String,
        required: false,
      },
      secondary: {
        type: String,
        required: false,
      },
      tertiary: {
        type: String,
        required: false,
      },
    },
    smsSendingOption: {
      orderPlaced: {
        type: Boolean,
        required: false,
      },
      orderConfirmed: {
        type: Boolean,
        required: false,
      },
      orderDelivered: {
        type: Boolean,
        required: false,
      },
      orderCanceled: {
        type: Boolean,
        required: false,
      },
      diamondOffer: {
        type: Boolean,
        required: false,
      },
      adminNotification: {
        type: Boolean,
        required: false,
      },
    },
    smsCustomMessages: {
      orderPlaced: {
        type: String,
        required: false,
        default: '',
      },
      orderConfirmed: {
        type: String,
        required: false,
        default: '',
      },
      orderDelivered: {
        type: String,
        required: false,
        default: '',
      },
      orderCanceled: {
        type: String,
        required: false,
        default: '',
      },
      diamondOffer: {
        type: String,
        required: false,
        default: '',
      },
      adminNotification: {
        type: String,
        required: false,
        default: '',
      },
    },
    rewardPointSettings: {
      isEnableRewardPoint: {
        type: Boolean,
        required: false,
        default: false,
      },
      rewardPointValue: {
        type: Number,
        required: false,
        default: 100,
      },
      rewardPointCurrency: {
        type: Number,
        required: false,
        default: 10,
      },
      conversionRate: {
        type: Number,
        required: false,
        default: 0.1, // rewardPointCurrency / rewardPointValue = 10 / 100 = 0.1
      },
      usePercentageBasedRewardPoints: {
        type: Boolean,
        required: false,
        default: false,
      },
      rewardPointPercentage: {
        type: Number,
        required: false,
        default: 1.0, // 1% of salePrice
      },
      calculationMethod: {
        type: String,
        required: false,
        default: 'manual',
      },
      exampleSalePrice: {
        type: Number,
        required: false,
        default: 1000,
      },
    },
    defaultUserHasAccess: {
      type: Boolean,
      required: false,
      default: true,
    },
    allowUserPhoneChange: {
      type: Boolean,
      required: false,
      default: true,
    },
    userPhoneChangeRequireOtp: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowUserEmailChange: {
      type: Boolean,
      required: false,
      default: true,
    },
    userEmailChangeRequireOtp: {
      type: Boolean,
      required: false,
      default: false,
    },
    /** Set once when legacy Mongoose default (OTP on) is corrected to product default (OTP off). */
    contactChangeOtpDefaultsVersion: {
      type: Number,
      required: false,
    },
    fraudCheck: FRAUD_CHECK_SETTING,
    epbx: EPBX_SETTING,
    diamondOffer: {
      isEnableDiamondOffer: {
        type: Boolean,
        required: false,
        default: false,
      },
      isEnableOnLandingPage: {
        type: Boolean,
        required: false,
        default: false,
      },
      threshold: {
        type: Number,
        required: false,
        default: 2000,
      },
      notificationText: {
        type: String,
        required: false,
        default: 'Add {{remainingAmount}} Taka more to get the Diamond Offer!',
      },
      cartNotificationText: {
        type: String,
        required: false,
        default:
          'Add More {{remainingAmount}} Taka more to get the Diamond Offer!',
      },
      confirmationMessage: {
        type: String,
        required: false,
        default: 'Congratulations! You have qualified for the Diamond Offer.',
      },
      diamondMessage: {
        type: String,
        required: false,
        default: 'Congratulations! You have qualified for the Diamond Offer.',
      },
      normalMessage: {
        type: String,
        required: false,
        default: 'Thank you for your order.',
      },
      startDate: {
        type: String,
        required: false,
      },
      endDate: {
        type: String,
        required: false,
      },
      logo: {
        type: String,
        required: false,
      },
      title: {
        type: String,
        required: false,
        default: 'Diamond Offer',
      },
    },
    appliedDemoThemeDesign: {
      demoWebsiteId: {
        type: Schema.Types.ObjectId,
        ref: 'DemoWebsite',
        required: false,
      },
      demoName: {
        type: String,
        required: false,
      },
      themeName: {
        type: String,
        required: false,
      },
      v2ThemeName: {
        type: String,
        required: false,
      },
      buildSystemVersion: {
        type: String,
        required: false,
      },
      appliedAt: {
        type: Date,
        required: false,
      },
      appliedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false,
      },
      configVersion: {
        type: String,
        required: false,
      },
      isCustomizedAfterApply: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    brandsPage: {
      title: {
        type: String,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
      bannerImage: {
        type: String,
        required: false,
      },
      bannerAlt: {
        type: String,
        required: false,
      },
    },
    globalCheckout: {
      enabled: {
        type: Boolean,
        required: false,
      },
      allowedMarkets: [
        {
          type: String,
          required: false,
        },
      ],
      mode: {
        type: String,
        enum: ['disabled', 'dry-run', 'live'],
        required: false,
      },
    },
    globalShipping: {
      enabled: {
        type: Boolean,
        required: false,
      },
      mode: {
        type: String,
        enum: ['disabled', 'flat-rate'],
        required: false,
      },
      marketCode: {
        type: String,
        required: false,
      },
      currencyCode: {
        type: String,
        required: false,
      },
      rates: [
        {
          id: {
            type: String,
            required: false,
          },
          name: {
            type: String,
            required: false,
          },
          deliveryType: {
            type: String,
            required: false,
          },
          amount: {
            type: Number,
            required: false,
          },
          currencyCode: {
            type: String,
            required: false,
          },
          enabled: {
            type: Boolean,
            required: false,
          },
          estimatedDelivery: {
            type: String,
            required: false,
          },
        },
      ],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
