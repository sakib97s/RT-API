import { Product } from 'src/pages/product/interfaces/product.interface';
import { User } from 'src/pages/user/interfaces/user.interface';

export interface Wishlist {
  _id?: string;
  slug?: string;
  product?: string | Product | any;
  user?: string | User | any;
  selectedQty?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
