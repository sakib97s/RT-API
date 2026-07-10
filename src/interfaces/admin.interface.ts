import { AdminRoles } from '../enum/admin-roles.enum';
import { AdminPermissions } from '../enum/admin-permission.enum';

export interface Admin {
  _id?: string;
  readOnly?: boolean;
  name?: string;
  username?: string;
  password?: string;
  phoneNo?: string;
  email?: string;
  gender?: string;
  profileImg?: string;
  hasAccess?: boolean;
  isChat?: boolean;
  role?: AdminRoles;
  permissions?: AdminPermissions[];
  registrationAt?: string;
  lastLoggedIn?: Date;
  affiliateStatusList?: any;
  security?: any;
  passwordChangedAt?: any;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  tokenExpiredIn?: number | string;
  data?: any;
  message?: string;
}

export interface AdminJwtPayload {
  _id?: string;
  username: string;
  role: AdminRoles;
  permissions: AdminPermissions[];
  sessionId?: string;
}

