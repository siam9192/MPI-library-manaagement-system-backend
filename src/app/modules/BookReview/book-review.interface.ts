import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBookReview extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrow: Types.ObjectId;
  rating: number;
  content?: string;
  status: EBookReviewStatus;
}

export enum EBookReviewStatus {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
}

export interface ICreateBookReviewPayload {
  borrowId: string;
  rating: number;
  content?: string;
}

export interface IBookReviewsFilterPayload {
  bookId?: string;
  roll?: string;
  status?: EBookReviewStatus;
  minRating?: string;
  maxRating: string;
}

export interface IMyBookReviewsFilterPayload {
  status?: EBookReviewStatus;
}
