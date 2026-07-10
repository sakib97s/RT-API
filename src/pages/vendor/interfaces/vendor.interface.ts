export interface Vendor {
  _id?: string;
  name?: string;
  registrationType: any;
  usernames?: string[];
  username?: string;
  isPasswordLess?: boolean;
  password?: string;
  phoneNo?: string;
  countryCode?: string;
  fullPhoneNo?: string;
  email?: string;
  gender?: string;
  profileImg?: string;
  role?: string;
  status?: 'active' | 'inactive';
  shops?: any[];
  hasAccess?: boolean;
  registrationAt?: string;
  lastLoggedIn?: Date;
  failedLoginStartTime?: Date;
  failedLoginCount?: number;
}

export interface VendorAuthResponse {
  success: boolean;
  token?: string;
  tokenExpiredInDays?: string;
  data?: any;
  message?: string;
}

export interface VendorJwtPayload {
  _id?: string;
  username: string;
}
