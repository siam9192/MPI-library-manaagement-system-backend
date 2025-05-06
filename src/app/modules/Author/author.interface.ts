import { IModelNecessaryFields, TModelTimeStamps } from '../../types/model.type';

export interface IAuthor extends IModelNecessaryFields {
  name: string;
  photoUrl?: string;
  biography: string;
  slug: string;
  count: {
    followers: number;
    books: number;
  };
  status: TAuthorStatus;
}

export type TAuthorStatus = `${EAuthorStatus}`;

export enum EAuthorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface ICreateAuthorPayload {
  name: string;
  photoUrl?: string;
  biography: string;
}

export interface IUpdateAuthorPayload {
  name?: string;
  photoUrl?: string;
  biography?: string;
}

export interface IGetPublicAuthorsFilterPayload {
  searchTerm?: string;
}

export interface IGetPublicAuthorsFilterPayload {
  searchTerm?: string;
  status?: TAuthorStatus;
}
