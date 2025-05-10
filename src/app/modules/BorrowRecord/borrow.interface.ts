import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowRecord extends IModelNecessaryFields {
  book: Types.ObjectId;
  copy: Types.ObjectId;
  student: Types.ObjectId;
  dueDate: Date;
  returnDate: Date;
  returnCondition?: EBorrowReturnCondition;
  isOverDue: boolean;
  fine: Types.ObjectId;
  status: EBorrowRecordStatus;
}

export enum EBorrowRecordStatus {
  ONGOING = 'ongoing',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
}

export type TReturnStatus = `${EBorrowReturnCondition}`;
export enum EBorrowReturnCondition {
  NORMAL = 'normal',
  DAMAGED = 'damaged',
  LOST = 'lost',
}

export interface IProcessBorrowPayload {
  bookConditionStatus: EBorrowReturnCondition;
  makeAvailable?: boolean;
  fineAmount?: number;
  isFineReceived?: boolean;
}

export interface IGetPendingReturnsFilterData {
  roll?: string;
}
