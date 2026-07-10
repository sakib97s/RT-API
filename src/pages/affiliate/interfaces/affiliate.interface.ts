import { Document } from 'mongoose';

export interface Affiliate extends Document {
  userId: string;
  name: string;
  email: string;
  phoneNo: string;
  status: string;
  dateString: string;
  [key: string]: any;
}
