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
  processedBy?: Types.ObjectId;
}

export type TReservationStatus = `${EReservationStatus}`;

export enum EReservationStatus {
  AWAITING = 'awaiting',
  FULFILLED = 'fulfilled',
  CANCELED = 'canceled',
  EXPIRED = 'EXPIRED',
}

export interface IGetReservationsFilterData {
  token?: string;
  roll?: string;
}
