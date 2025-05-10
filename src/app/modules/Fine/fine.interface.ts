import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';
export interface IFine extends IModelNecessaryFields {
  student: Types.ObjectId;
  borrow: Types.ObjectId;
  amount: number;
  reason: string;
  status: TFineStatus;
  issuedDate: Date;
  paidDate: Date | null;
  index: 0 | 1;
}

export type TFineReason = `${EFineReason}`;

export enum EFineReason {
  LATE_RETURN = 'late return',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

type TFineStatus = `${EFineStatus}`;
export enum EFineStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  waived = 'waived',
}

export interface IFinesFilterPayload {
  status?: EFineStatus;
  roll?: string;
}
