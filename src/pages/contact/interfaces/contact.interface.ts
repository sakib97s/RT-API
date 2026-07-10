export interface Contact {
  readOnly?: boolean;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  emailSent?: boolean;
}
