import { Product } from 'src/pages/product/interfaces/product.interface';
import { User } from 'src/pages/user/interfaces/user.interface';

export interface Cart {
  minimumWholesaleQuantity: any;
  _id?: string;
  slug?: string;
  product?: string | Product | any;
  user?: string | User | any;
  selectedQty?: number;
  variation: any;
  isWholesale?: boolean;
  phoneModel?: any;
  sku?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
