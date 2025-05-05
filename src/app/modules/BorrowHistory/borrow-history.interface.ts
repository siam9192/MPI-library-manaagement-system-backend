import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowHistory extends IModelNecessaryFields {
  title: string;
  description: string;
  book: Types.ObjectId;
  borrow: Types.ObjectId;
}
