export interface Theme {
  _id?: string;
  name?: string;
  category?: any;
  subCategory?: any;
  sourcePath?: string;
  targetPath?: string;
  images?: string[];
  pdf?: string;
  previewLink?: string;
  version?: string | number;
  pm2path?: string;
  hostDomain?: string;
  availability?: string;
  status?: string;
  totalInstalled?: number;
  themeCustomOptions?: ThemeCustomOption[];
  createdAt?: string;
  updatedAt?: string;
}

interface ThemeCustomOption {
  name?: string;
  type?: string;
  selectType?: 'single' | 'multiple';
  value?: CustomOptionValue[];
}

interface CustomOptionValue {
  name?: string;
  image?: string | null;
  note?: string;
}

