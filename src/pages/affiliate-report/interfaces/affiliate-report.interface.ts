import { Document } from 'mongoose';

export interface AffiliateReport extends Document {
  type: string;
  affiliate: any;
  product: any;
  ownerId: string;
  ownerType: string;
  shopId: any;
  amount: number;
  status: string;
  dateString: string;
  [key: string]: any;
}
