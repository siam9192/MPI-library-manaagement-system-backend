import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IWishlistBook extends IModelNecessaryFields {
  book: Types.ObjectId;
  student: Types.ObjectId;
}

export interface ICreateWishlistBookPayload {
  bookId: string;
}
