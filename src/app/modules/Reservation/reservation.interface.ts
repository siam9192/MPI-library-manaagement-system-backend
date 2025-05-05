import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';

export interface IReservation extends TModelTimeStamps {
  _id: Types.ObjectId;
  book: Types.ObjectId;
  request: Types.ObjectId;
  qty: number;
  secret: string;
  expiredAt: Date;
  status: TReservationStatus;
}

export type TReservationStatus = `${EReservationStatus}`;

export enum EReservationStatus {
  AWAITING_PICKUP = 'Awaiting_Pickup',
  HANDED_OVER = 'Handed_Over',
  HANDOVER_FAILED = 'Handover_Failed',
  EXPIRED = 'Expired',
}

export interface IGetReservationsFilterData {
  token?: string;
  roll?: string;
}
