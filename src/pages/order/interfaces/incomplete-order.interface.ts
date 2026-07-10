import { Category } from '../../catalog/category/interfaces/category.interface';
import { SubCategory } from '../../catalog/sub-category/interfaces/sub-category.interface';
import { ChildCategory } from '../../catalog/child-category/interfaces/child-category.interface';

import { CourseType, StatusType } from '../../../types/all-data-types.type';

export type IncompleteOrder = {
  _id?: string;
  shop?: string;
  carts?: string[];
  name?: string;
  phoneNo?: string;
  email?: string;
  division?: string;
  pendingReviewItems?: any;
  area?: string;
  zone?: string;
  paymentStatus?: string;
  orderStatus?: number;
  subTotal?: number;
  discount?: number;
  grandTotal?: number;
  deliveryCharge?: number;
  checkoutDate?: string;
  deliveryNote?: string;
  paymentRefId?: string;
  shippingAddress?: string;
  user?: string;
  orderType?: CourseType;
  orderedItems?: any[];
  createdAt?: string;
  updatedAt?: string;
  paymentType: string;
  courierData: any;
  orderId: string;
  orderTimeline: any;
  providerName: string;
  providerType: string;
  adjustProductQuantity: boolean;
  status?: StatusType;
};

export interface Item {
  _id?: string;
  name?: string;
  slug?: string;
  category?: Category;
  subCategory?: SubCategory;
  childCategory?: ChildCategory;
  isLiveClass?: boolean;
  salePrice?: number;
  discountType?: number;
  discountAmount?: number;
}
