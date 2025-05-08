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
  CHECKED_OUT = 'checked_out',
  RESERVED = 'reserved',
  Lost = 'lost',
  DAMAGED = 'damaged',
  DISCARDED = 'discarded',
}
