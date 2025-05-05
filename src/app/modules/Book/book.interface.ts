import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';

export interface IBook extends TModelTimeStamps {
  _id: Types.ObjectId;
  name: string;
  coverPhotoUrl: string;
  genre: Types.ObjectId;
  author: Types.ObjectId;
  shelfLocation: string;
  availableCopies: number;
  avgRating: number;
  reviewCount: number;
  wishListedCount: number;
  exceptedAvailableDate?: Date;
  status: TBookStatus;
  index: number;
}

type TBookStatus = `${EBookStatus}`;

export enum EBookStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DELETED = 'Deleted',
}

export interface ICreateBookPayload {
  name: string;
  coverPhotoUrl: string;
  genre: string;
  author: string;
  shelfLocation: string;
  availableCopies: number;
  status?: TBookStatus;
}

export interface IUpdateBookPayload extends Partial<ICreateBookPayload> {}

export interface IBooksFilterData {
  searchTerm?: string;
  genreIds?: string;
  authorIds?: string;
}

export interface IManageBooksFilterData {
  searchTerm?: string;
  genreIds?: string;
  authorIds?: string;
  status: string;
}
