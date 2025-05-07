import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IFollow extends IModelNecessaryFields {
  student: Types.ObjectId;
  author: Types.ObjectId;
}

export interface ICreateFollowPayload {
  authorId: string;
}

export interface IMineFollowsFilterPayload {
  searchTerm?: string;
}

export interface IAuthorFollowersFilterPayload {
  searchTerm?: string;
}
