import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';
import Pick from '../../utils/pick';

export interface IGenre extends TModelTimeStamps {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  imageUrl?: string;
  booksCount?: number;
  status: TGenreStatus;
}

export type TGenreStatus = `${EGenreStatus}`;

export enum EGenreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface ICreateGenrePayload extends Pick<IGenre, 'name' | 'imageUrl'> {}

export interface IPublicGenresFilterPayload {
  searchTerm?: string;
}

export interface IGenresFilterPayload {
  searchTerm?: string;
  status?: TGenreStatus;
}

export interface IGenreUpdatePayload {
  name?: string;
  imageUrl?: string;
}
