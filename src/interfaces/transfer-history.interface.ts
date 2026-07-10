import { Vendor } from "src/pages/vendor/interfaces/vendor.interface";

export interface TransferHistory {
  _id?: string;
  readOnly?: boolean;
  orderNumber?: string[];
  orderIds?: string[];
  vendor?: string | Vendor;
  dateString?: string;
  payable?: number;
  vendorPaymentTransferAmount?: number;
  vendorPaymentTransferStatus?: string;
}
