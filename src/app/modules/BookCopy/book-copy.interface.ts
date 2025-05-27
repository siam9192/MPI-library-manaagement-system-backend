import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBookCopy extends IModelNecessaryFields {
  book: Types.ObjectId;
  status: EBookCopyStatus;
  shelfLocation: string;
  condition: EBookCopyCondition;
}

export type TBookCopyCondition = `${EBookCopyCondition}`;

export enum EBookCopyCondition {
  GOOD = 'good',
  POOR = 'poor',
}

export enum EBookCopyStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  CHECKED_OUT = 'checked_out',
  RESERVED = 'reserved',
  LOST = 'lost',
  DELETED = 'deleted',
}

export interface ICreateBookCopyPayload {
  bookId: string;
  shelfLocation: string;
  condition: EBookCopyCondition;
}

export interface IUpdateBookCopyPayload {
  shelfLocation: string;
  condition: EBookCopyCondition;
}
