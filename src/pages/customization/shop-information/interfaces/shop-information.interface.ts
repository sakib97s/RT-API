export interface ShopInformation {
  _id?: string;
  siteName?: string;
  shortDescription?: string;
  siteLogo?: string;
  logoPrimary?: string;
  websiteName?: string;
  addresses: ShopObject[];
  emails?: ShopObject[];
  phones: ShopObject[];
  downloadUrls: ShopObject[];
  socialLinks: ShopObject[];
  navLogo?: string;
  footerLogo?: string;
  headerNews?: string;
  othersLogo?: string;
  whatsappNumber: string;
  color?: string;
}

export interface ShopObject {
  type: number;
  value: string;
}
