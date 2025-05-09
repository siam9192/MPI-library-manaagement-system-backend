import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowRecord extends IModelNecessaryFields {
  book: Types.ObjectId;
  student: Types.ObjectId;
  dueDate: Date;
  returnDate: Date;
  status: EBorrowRecordStatus;
}

export enum EBorrowRecordStatus {
  ONGOING = 'ongoing',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
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
