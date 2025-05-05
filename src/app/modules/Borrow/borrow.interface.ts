import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrow extends IModelNecessaryFields {
  request: Types.ObjectId;
  handedOveredBy: Types.ObjectId;
  collectedBy?: Types.ObjectId;
  book: Types.ObjectId;
  student: Types.ObjectId;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  returnStatus?: TReturnStatus;
  status: TBorrowStatus;
}

export type TBorrowStatus = `${EBorrowStatus}`;

export enum EBorrowStatus {
  ONGOING = 'Ongoing',
  OVERDUE = 'Overdue',
  RETURNED = 'Returned',
}

export type TReturnStatus = `${EReturnStatus}`;
export enum EReturnStatus {
  GOOD = 'Good',
  DAMAGED = 'Damaged',
  LOST = 'Lost',
}

export interface IReturnBorrowPayload {
  bookStatus: TReturnStatus;
  isMakeAvailable?: boolean;
  fineAmount?: number;
  isFineReceived?: boolean;
}

export interface IGetPendingReturnsFilterData {
  roll?: string;
}
