
import { IModelNecessaryFields, TModelTimeStamps } from '../../types/model.type';

export interface IEmailVerificationRequest extends IModelNecessaryFields {
  email: string;
  otp: string;
  otpResendCount: number;
  expireAt: Date;
  status: TEmailVerificationRequestStatus;
}

export type TEmailVerificationRequestStatus = `${EEmailVerificationRequestStatus}`;

export enum EEmailVerificationRequestStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}
