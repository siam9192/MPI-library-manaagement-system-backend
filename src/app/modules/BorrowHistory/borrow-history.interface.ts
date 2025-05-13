import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowHistory extends IModelNecessaryFields {
  title: string;
  description: string;
  status:EBorrowHistoryStatus,
  bookId:string
}


export enum EBorrowHistoryStatus {
  REQUEST_PENDING = 'request_pending',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_CANCELED = 'request_canceled',
  REQUEST_REJECTED = 'request_rejected',
  REQUEST_EXPIRED = 'request_expired',
  RESERVATION_AWAITING = 'reservation_awaiting',
  RESERVATION_FULFILLED = 'reservation_fulfilled',
  RESERVATION_CANCELED = 'canceled',
  RESERVATION_EXPIRED = 'expired',
  BORROW_ONGOING = 'borrow_ongoing',
  BORROW_RETURNED = 'borrow_returned',
  BORROW_OVERDUE = 'borrow_overdue',
  BORROW_LOST = 'borrow_lost',
  
}

export enum EBorrowHistoryEnum {
  DOWNLOAD_TICKET = ''
}