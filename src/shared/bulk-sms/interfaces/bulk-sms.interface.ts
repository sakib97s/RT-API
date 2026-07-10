export interface SmsSentConfig {
  providerName: string;
  phoneNo: string;
  message: string;
  apiKey: string;
  smsClientId: string;
  smsSenderSecret?: string;
  smsSenderId?: string;
  countryCode?: string;
}
