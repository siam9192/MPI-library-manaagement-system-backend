import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IHoldBorrowRequest extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
}

export interface ICreateHoldBorrowRequestPayload {
  bookId: string;
  borrowForDays: number;
}
