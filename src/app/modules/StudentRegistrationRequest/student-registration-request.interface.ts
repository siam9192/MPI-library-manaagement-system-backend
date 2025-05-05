import { Types } from 'mongoose';
import {
  IModelNecessaryFields,
  TGender,
  TModelTimeStamps,
  TSemester,
} from '../../types/model.type';
import { TShift } from '../Student/student.interface';

export interface IStudentRegistrationRequest extends IModelNecessaryFields {
  fullName: string;
  gender: TGender;
  roll: number;
  email: string;
  department: string;
  semester: TSemester;
  shift: TShift;
  session: string;
  password: string;
  isEmailVerified: boolean;
  expireAt: Date;
  status: TStudentRegistrationRequestStatus;
  rejectReason?: string;
  index: number;
}

export type TStudentRegistrationRequestStatus = `${EStudentRegistrationRequestStatus}`;

export enum EStudentRegistrationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface IRejectStudentRegistrationRequestPayload {
  requestId: string;
  reasonForReject?: string;
}

export interface IStudentRegistrationRequestFilterPayload {
  searchTerm?: string;
}
