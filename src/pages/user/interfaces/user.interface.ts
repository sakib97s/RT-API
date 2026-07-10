import { StatusType } from '../../../types/all-data-types.type';

export interface User {
  _id?: string;
  shop?: string;
  name?: string;
  registrationType: 'phone';
  username?: string;
  isPasswordLess?: boolean;
  password?: string;
  phoneNo?: string;
  countryCode?: string;
  fullPhoneNo?: string;
  email?: string;
  gender?: string;
  profileImg?: string;
  status?: 'active' | 'inactive';
  hasAccess?: boolean;
  registrationAt?: string;
  lastLoggedIn?: Date;
  failedLoginStartTime?: Date;
  failedLoginCount?: number;
  addresses?: any[];
}

export interface UserAuthResponse {
  success: boolean;
  token?: string;
  tokenExpiredInDays?: string;
  data?: any;
  message?: string;
}

export interface UserJwtPayload {
  _id?: string;
  username: string;
}

export interface UserAddress {
  _id?: string;
  user?: string;
  name?: string;
  phone?: string;
  division?: string;
  area?: string;
  zone?: string;
  address?: string;
  addressType?: string;
  status?: StatusType;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
