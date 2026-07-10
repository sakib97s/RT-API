import { Document } from 'mongoose';

export interface ThemeSubCategory extends Document {
  name: string;
  slug: string;
  themeCategory: {
    _id: any;
    name: string;
    slug: string;
  };
  image: string;
  description: string;
  status: string;
  deleteDateString: string;
  searchHints: string;
}
