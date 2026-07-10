export interface ResponsePayload {
  success: boolean;
  data?: any;
  count?: number;
  message?: string;
  reports?: any;
  filterGroup?: any;
  categorySummary?: {
    byCategory: Array<{
      _id: string;
      categoryName: string;
      totalAmount: number;
      totalCount: number;
    }>;
    grandTotal: number;
    grandCount: number;
    categoryCount: number;
  };
}

export interface ImageUploadResponse {
  name: string;
  size: number;
  url: string;
}

export interface FileUploadResponse {
  extension: string;
  name: string;
  size: number;
  url: string;
}
