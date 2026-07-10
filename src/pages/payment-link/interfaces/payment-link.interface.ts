export interface PaymentLink {
  name: string;
  slug: string;
  image?: string;
  pageName?: string;
  seoDescription?: string;
  keyWord?: string;
}

export interface AffiliateSaleReport {
  refferId: string;
  paymentLinkId: string;
  shopId: string;
  amount?: number;
  dateString?: string;
}



