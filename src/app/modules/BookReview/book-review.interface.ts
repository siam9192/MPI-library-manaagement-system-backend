import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBookReview extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrow:Types.ObjectId,
  rating: number;
  
}
