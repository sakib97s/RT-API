import { Theme } from 'src/interfaces/theme.interface';
import { Package } from 'src/interfaces/package.interface';

export interface Shop {
  _id?: string;
  websiteName?: string;
  slug?: string;
  pages?: any;
  domain?: string;
  affiliateStatusList?: any;
  subDomain?: string;
  category?: string;
  dateString?: string;
  subCategory?: string;
  package?: Package;
  theme?: Theme;
  themeColor?: string;
  owner?: string;
  fraudCheckDate?: string;
  buildStatus?: string;
  port?: number;
  todayFraudCheckCount?: number;
  isSsr?: boolean;
  users?: any[];
  domainType?: 'sub-domain' | 'domain' | 'domain-http-www' | 'domain-www-http';
  branchAccess?: BranchAccess[];
}

export interface BranchAccess {
  user?: string | any;
  branches?: string[] | any[];
  permissions?: {
    canView?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canTransfer?: boolean;
    canApproveTransfer?: boolean;
  };
}

export interface PreShop {
  _id?: string;
  websiteName?: string;
  phoneNo?: string;
  paymentRefId?: string;
}
