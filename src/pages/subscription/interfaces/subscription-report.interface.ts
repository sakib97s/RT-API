import { Package } from 'src/interfaces/package.interface';

export interface SubscriptionReport {
  _id?: string;
  shop?: string;
  package?: Package;
  starDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  createdAt?: string;
  updatedAt?: string;
}
