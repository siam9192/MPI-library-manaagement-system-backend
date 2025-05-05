import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';

export interface IBorrowRequest extends TModelTimeStamps {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
  rejectedFor?: string;
  expireAt: Date;
  status: TBorrowRequestStatus;
}

export type TBorrowRequestStatus = `${EBorrowRequestStatus}`;

export enum EBorrowRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CANCELED = 'Canceled',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

export interface ICreateBorrowRequestPayload {
  bookId: string;
  borrowForDays: number;
}

export interface IManageBorrowRequestsFiltersData {
  roll?: string;
}

export interface IApproveBorrowRequestPayload {
  expireDate: Date;
}
