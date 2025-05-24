import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IWaitlist extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
}

export interface ICreateWaitlistPayload {
  bookId: string;
  borrowForDays: number;
}
