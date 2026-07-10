import { StatusType } from '../../../../types/all-data-types.type';

export interface Category {
  _id?: string;
  readOnly?: boolean;
  featureStatus?: boolean;
  menuStatus?: boolean;
  name?: string;
  slug?: string;
  image?: string;
  description?: string;
  featureImage?: string;
  serial?: number;
  priority?: number;
  status?: StatusType;
  createdAt?: Date;
  updatedAt?: Date;
}
