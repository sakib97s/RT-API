import { StatusType } from '../../../types/all-data-types.type';
import { Category } from '../../catalog/category/interfaces/category.interface';
import { SubCategory } from '../../catalog/sub-category/interfaces/sub-category.interface';
import { ChildCategory } from '../../catalog/child-category/interfaces/child-category.interface';
import { Brand } from '../../catalog/brand/interfaces/brand.interface';
import { Tag } from '../../catalog/tag/interfaces/tag.interface';

export interface Product {
  _id?: string;
  name?: string;
  slug?: string;
  parentSku?: string;
  category?: Category[];
  subCategory?: SubCategory;
  childCategory?: ChildCategory;
  brand?: Brand;
  tags?: Tag[];
  images?: string[];
  videoUrl?: string;
  driveLinks?: any;
  sizeChartMesImage?: string;
  sizeChartFitImage?: string;
  sizeChartInImage?: string;
  sizeChartCnImage?: string;
  description?: string;
  url?: string;
  specifications?: Specification[];
  price?: number;
  discountType?: string;
  discountAmount?: number;
  advancePayment?: number;
  deliveryCharge?: number;
  salePrise?: number;
  salePrice?: number; // Alias for salePrise
  minimumWholesaleQuantity?: number;
  regularPrise?: number;
  regularPrice?: number; // Alias for regularPrise
  costPrice?: number;
  purchasePrice?: number; // Alias for costPrice
  sku?: string;
  quantity?: number;
  expiryDate?: Date;
  expiryDateString?: string;
  isVariation?: boolean;
  variation?: string;
  variationOptions?: string[];
  variation2?: string;
  variation2Options?: string[];
  variationList?: VariationList[];
  vendor?: any;
  totalSold?: number;
  totalView?: number;
  ratingCount?: number;
  ratingTotal?: number;
  reviewTotal?: number;
  ratingDetails?: RatingDetails;
  status?: StatusType;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isCentralProduct?: boolean;
  weight?: number;
  unit?: string;
  warranty?: string;
  returnPolicy?: string;
  exchangePolicy?: string;
  deliveryTime?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Specification {
  name?: string;
  value?: string;
}

export interface VariationList {
  _id?: string;
  name?: string;
  sku?: string;
  price?: number;
  discountType?: string;
  discountAmount?: number;
  quantity?: number;
  trackQuantity?: boolean;
  image?: string;
}

export interface RatingDetails {
  oneStar?: number;
  twoStar?: number;
  threeStar?: number;
  fourStar?: number;
  fiveStar?: number;
}
