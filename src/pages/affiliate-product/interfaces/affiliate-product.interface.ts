import { Document } from 'mongoose';

export interface AffiliateProduct extends Document {
  name: string;
  ownerId: string;
  ownerType: string;
  url: string;
  description: string;
  price: number;
  regularPrice: number;
  discountAmount: number;
  image: string;
  status: string;
  dateString: string;
  [key: string]: any;
}
