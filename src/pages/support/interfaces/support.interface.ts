export interface Support {
  _id?: string;
  shop: string;
  name?: string;
  phone?: string;
  email?: string;
  url?: string;
  businessName?: string;
  priority?: 'low' | 'medium' | 'high';
  type: 'issue' | 'feedback' | 'feature';
  description: string;
  status?: 'Pending' | 'Received' | 'Working On It' | 'Resolved' | 'ReOpen';
  rating?: number;
  review?: string;
  createdAt?: string;
  updatedAt?: string;
}
