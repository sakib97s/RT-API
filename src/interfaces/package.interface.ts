import { Specification } from './specification.interface';

export interface Package {
  _id?: string;
  name?: string;
  type?: string;
  features?: string[];
  price?: number;
  purchasePrice?: number;
  renewPrice?: number;
  discountType?: string;
  discountAmount?: number;
  renewInDay?: number;
  dataLimits?: Specification[];
  routeLimits?: Specification;
  featureLimits?: Specification;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

