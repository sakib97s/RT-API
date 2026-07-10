import { StatusType } from '../../../../types/all-data-types.type';

export interface Tag {
  _id?: string;
  readOnly?: boolean;
  name?: string;
  slug?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: Date;
  updatedAt?: Date;
}
