export interface Setting {
  _id?: string;
  caseOnDelivery?: boolean;
  deliveryInDhaka?: number;
  deliveryOutsideDhaka?: number;
  deliveryOutsideBD?: number;
  deliveryCharges?: any[];
  deliveryOptionType?: any;
  courierMethods?: any[];
  smsMethods?: any[];
  smsSendingOption?: SmsSendingOption;
  smsCustomMessages?: SmsCustomMessages;
  paymentMethods: any[];
  socialLogins: any[];
  chats: any[];
  advancePayment: any[];
  offers: any[];
  analytics: any;
  orderNotification: any;
  productSetting: any;
  currency: any;
  orderSetting: any;
  facebookCatalog: any;
  isCashOnDeliveryOff: boolean;
  dashboardStyle?: string;
  /** Vendor panel: classic = legacy product UI, professional = product-pro UI */
  productControlStyle?: 'classic' | 'professional';
  rewardPointSettings?: RewardPointSettings;
  defaultUserHasAccess?: boolean;
  allowUserPhoneChange?: boolean;
  userPhoneChangeRequireOtp?: boolean;
  allowUserEmailChange?: boolean;
  userEmailChangeRequireOtp?: boolean;
  /** Internal: legacy OTP-default migration marker (see SettingService.getSetting). */
  contactChangeOtpDefaultsVersion?: number;
  fraudCheck?: {
    apiKey?: string;
    apiType?: 'free' | 'pro';
  };
  epbx?: {
    isEnabled?: boolean;
    apiToken?: string;
    apiBaseUrl?: string;
    callerId?: string;
    agentExtension?: string;
    storeName?: string;
    customText?: string;
    confirmText?: string;
    cancelText?: string;
    webhookBaseUrl?: string;
  };
  brandsPage?: {
    title?: string;
    description?: string;
    bannerImage?: string;
    bannerAlt?: string;
  };
  globalCheckout?: {
    enabled?: boolean;
    allowedMarkets?: string[];
    mode?: 'disabled' | 'dry-run' | 'live';
  };
  globalShipping?: {
    enabled?: boolean;
    mode?: 'disabled' | 'flat-rate';
    marketCode?: string;
    currencyCode?: string;
    rates?: Array<{
      id?: string;
      name?: string;
      deliveryType?: string;
      amount?: number;
      currencyCode?: string;
      enabled?: boolean;
      estimatedDelivery?: string;
    }>;
  };
  createdAt?: Date;
  diamondOffer?: {
    isEnableDiamondOffer: boolean;
    isEnableOnLandingPage: boolean;
    threshold: number;
    notificationText: string;
    cartNotificationText: string;
    confirmationMessage: string;
    diamondMessage: string;
    normalMessage: string;
    startDate?: string;
    endDate?: string;
    logo?: string;
    title?: string;
  };
  shop?: any;
  bizmation?: {
    isEnable?: boolean;
    inventoryId?: number;
    apiAccessToken?: string;
  };
  updatedAt?: Date;
}

interface SmsSendingOption {
  orderPlaced?: boolean;
  orderConfirmed?: boolean;
  orderDelivered?: boolean;
  orderCanceled?: boolean;
  diamondOffer?: boolean;
}

interface SmsCustomMessages {
  orderPlaced?: string;
  orderConfirmed?: string;
  orderDelivered?: string;
  orderCanceled?: string;
  diamondOffer?: string;
}

export interface RewardPointSettings {
  isEnableRewardPoint?: boolean;
  rewardPointValue?: number;
  rewardPointCurrency?: number;
  conversionRate?: number;
  usePercentageBasedRewardPoints?: boolean;
  rewardPointPercentage?: number;
  calculationMethod?: string;
  exampleSalePrice?: number;
}
