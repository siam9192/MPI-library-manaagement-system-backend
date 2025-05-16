import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowRequest extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
  rejectReason?: string;
  expireAt: Date;
  status: EBorrowRequestStatus;
  processedBy?: {
    id: Types.ObjectId;
    at: Date;
  };
  index: 0 | 1;
}

export type TBorrowRequestStatus = `${EBorrowRequestStatus}`;

export enum EBorrowRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface ICreateBorrowRequestPayload {
  bookId: string;
  borrowForDays: number;
}

export interface IBorrowRequestsFilterPayload {
  roll?: string;
  status?: EBorrowRequestStatus;
}

export interface IApproveBorrowRequestPayload {
  copyId: string;
}
