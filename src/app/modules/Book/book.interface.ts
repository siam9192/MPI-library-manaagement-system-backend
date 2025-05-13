import { Types } from 'mongoose';
import { IBookCopy } from '../BookCopy/book-copy.interface';

export interface IBook {
  _id: Types.ObjectId;
  name: string;
  coverPhotoUrl: string;
  genre: Types.ObjectId;
  author: Types.ObjectId;
  avgRating: number;
  count: {
    totalCopies: number;
    availableCopies: number;
    wishlistedCount: number;
    reviews: number;
  };
  expectedAvailableDate?: Date;
  status: EBookStatus;
  index: number;
}
export type TBookStatus = `${EBookStatus}`;

export enum EBookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface ICreateBookPayload {
  name: string;
  coverPhotoUrl: string;
  genreId: string;
  authorId: string;
  copies: Pick<IBookCopy, 'condition' | 'shelfLocation'>[];
}

export interface IUpdateBookPayload {
  name: string;
  coverPhotoUrl: string;
  genre: string;
  author: string;
}

export interface IBooksFilterPayload {
  searchTerm?: string;
  genreIds?: string;
  authorIds?: string;
  status?: string;
}
