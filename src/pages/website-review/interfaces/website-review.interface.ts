export interface WebsiteReview {
  _id?: string;
  readOnly?: boolean;
  name?: string;
  slug?: string;
  images?: string[]
  facebookLink?: string;
  review?: string;
  websiteLink?: string;
  priority?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
