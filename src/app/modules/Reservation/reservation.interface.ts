import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IReservation extends IModelNecessaryFields {
  student: Types.ObjectId;
  book: Types.ObjectId;
  copy: Types.ObjectId;
  request: Types.ObjectId;
  expiryDate: Date;
  secret: string;
  status: EReservationStatus;
  processedBy?: {
    id: Types.ObjectId;
    at: Date;
  };
  index: 0 | 1;
}

export type TReservationStatus = `${EReservationStatus}`;

export enum EReservationStatus {
  AWAITING = 'awaiting',
  FULFILLED = 'fulfilled',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export interface IReservationsFilterPayload {
  secret?: string;
  roll?: string;
  status?: EReservationStatus;
}

export interface IMyReservationsFilterPayload {
  status?: EReservationStatus;
}

export interface ICreateReservationPayload {
  bookId: string;
  borrowForDays: number;
}
