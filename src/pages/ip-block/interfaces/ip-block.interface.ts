import { StatusType } from '../../../types/all-data-types.type';

export type IpBlock = {
  _id?: string;
  title?: string;
  type?: string;
  image?: string;
  url?: string;
  urlType?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: string;
  updatedAt?: string;
};
