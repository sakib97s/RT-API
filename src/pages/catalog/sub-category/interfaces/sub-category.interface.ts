import { StatusType } from '../../../../types/all-data-types.type';

export interface SubCategory {
  _id?: string;
  readOnly?: boolean;
  category?: string;
  name?: string;
  slug?: string;
  image?: string;
  priority?: number;
  status?: StatusType;
  createdAt?: Date;
  updatedAt?: Date;
  isSizeChart?:Boolean,
  sizeChartInImage?:string;
  sizeChartCnImage?:string;
  sizeChartFitImage?:string;
  sizeChartMesImage?:string;
}
