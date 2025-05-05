import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';

export interface IAuthor extends TModelTimeStamps {
  _id: Types.ObjectId;
  name: string;
  photoUrl: string;
  about: string;
  followersCount: number;
  status: TAuthorStatus;
}

export type TAuthorStatus = `${EAuthorStatus}`;

export enum EAuthorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'Inactive',
}

export interface ICreateAuthorPayload {
  name: string;
  photoUrl: string;
  about: string;
}
