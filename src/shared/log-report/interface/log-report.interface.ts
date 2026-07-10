import { Vendor } from '../../../pages/vendor/interfaces/vendor.interface';

export interface LogReport {
  _id?: string;
  time?: string;
  collectionName?: string;
  vendor?: Vendor;
  description?: string;
  dateString?: string;
  month?: number;
  year?: number;
  type?: 'create' | 'edit' | 'delete' | 'put';
  createdAt?: Date;
  updatedAt?: Date;
}
