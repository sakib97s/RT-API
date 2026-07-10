import { Package } from 'src/interfaces/package.interface';

export interface Subscription {
  _id?: string;
  shop?: string;
  package?: Package;
  starDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
