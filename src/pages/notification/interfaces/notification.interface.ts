import { StatusType } from '../../../types/all-data-types.type';

export type Notification = {
  _id?: string;
  name?: string;
  type?: string;
  title?: string;
  title2?: string;
  image?: string;
  url?: string;
  urlType?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: string;
  updatedAt?: string;
};
