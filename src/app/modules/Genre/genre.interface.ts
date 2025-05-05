import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';
import Pick from '../../utils/pick';

export interface IGenre extends TModelTimeStamps {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  imageUrl?: string;
  status: TGenreStatus;
}

export type TGenreStatus = `${EGenreStatus}`;

export enum EGenreStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'Inactive',
}

export interface ICreateGenrePayload extends Pick<IGenre, 'name' | 'imageUrl'> {}
