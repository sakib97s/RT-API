import { StatusType } from '../../../../types/all-data-types.type';

export type Announcement = {
  _id?: string;
  title?: string;
  type?: string;
  image?: string;
  url?: string;
  urlType?: string;
  description?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: string;
  updatedAt?: string;
};
