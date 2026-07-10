import { StatusType } from '../../../types/all-data-types.type';


export type Blog = {
  _id?: string;
  title?: string;
  type?: string;
  slug?: string;
  image?: string;
  url?: string;
  images?: any;
  urlType?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: string;
  updatedAt?: string;
};
