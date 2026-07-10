import { FileType } from '../../../../types/all-data-types.type';

export interface Gallery {
  _id?: string;
  name?: string;
  url?: string;
  folder?: string;
  size?: number;
  type?: FileType;
  extension?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
