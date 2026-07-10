import { StatusType } from '../../../../types/all-data-types.type';
import { Category } from '../../category/interfaces/category.interface';
import { SubCategory } from '../../sub-category/interfaces/sub-category.interface';

export interface ChildCategory {
  _id?: string;
  readOnly?: boolean;
  category?: string;
  subCategory?: string;
  name?: string;
  slug?: string;
  images?: [string];
  description?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: Date;
  updatedAt?: Date;
}
