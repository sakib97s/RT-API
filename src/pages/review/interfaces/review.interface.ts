import { User } from "src/pages/user/interfaces/user.interface";


export type Review = {
  _id?: string;
  user?: string | User;
  vendor?: string | any;
  name?: string;
  reviewDate: string;
  review: string;
  rating: number;
  status: boolean;
  reply: string;
  replyDate: string;
  like: number;
  dislike: number;
  images: string[];
};
