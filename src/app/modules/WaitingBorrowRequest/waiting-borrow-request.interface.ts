import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IWaitingBorrowRequest extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
}
