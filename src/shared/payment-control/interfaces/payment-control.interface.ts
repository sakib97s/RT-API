export interface CourierApiConfig {
  providerName?: string;
  apiKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface BkashApiConfig {
  url?: string;
  username?: string;
  password?: string;
  appKey?: string;
  appSecret?: string;
  mode?: '0011';
  payerReference?: string;
  paymentID?: string;
  callbackURL?: string;
  currency?: 'BDT';
  intent?: 'sale';
  merchantInvoiceNumber?: string;
  production?: boolean;
  order_Id?: string;
  orderId?: string;
  amount?: number;
}

export interface SslCommerzApiConfig {
  store_id: string;
  store_passwd: string;
  baseUrl?: string;
  sessionKey?: string;
  tran_id: string;
}

export interface SslCommerzInit extends SslCommerzApiConfig {
  total_amount: number;
  currency: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  shipping_method: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_add2: string;
  cus_city: string;
  cus_state: string;
  cus_postcode: string;
  cus_country: string;
  cus_phone: string;
  cus_fax: string;
  ship_name: string;
  ship_add1: string;
  ship_add2: string;
  ship_city: string;
  ship_state: string;
  ship_postcode: string;
  ship_country: string;
  multi_card_name?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}
