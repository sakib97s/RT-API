export interface Setting {
  _id?: string;
  caseOnDelivery?: boolean;
  deliveryInDhaka?: number;
  deliveryOutsideDhaka?: number;
  deliveryOutsideBD?: number;
  deliveryCharges?: any[];
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
  createdAt?: Date;
  updatedAt?: Date;
}

interface SmsSendingOption {
  orderPlaced?: boolean;
  orderConfirmed?: boolean;
  orderDelivered?: boolean;
  orderCanceled?: boolean;
}

interface SmsCustomMessages {
  orderPlaced?: string;
  orderConfirmed?: string;
  orderDelivered?: string;
  orderCanceled?: string;
}
