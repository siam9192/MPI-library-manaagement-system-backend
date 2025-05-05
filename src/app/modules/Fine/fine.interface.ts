import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IFine extends IModelNecessaryFields {
  borrow: Types.ObjectId;
  amount: number;
  reason: string;
  status: TFineStatus;
}

export type TFineStatus = `${EFineStatus}`;

export enum EFineStatus {
  PENDING = 'Pending',
  PAID = 'PAID',
}

export interface IGetDueFinesFilterData {
  roll: string;
  token: string;
}
