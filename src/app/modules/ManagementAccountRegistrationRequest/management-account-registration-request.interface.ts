import { ObjectId } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';
import { EUserRole } from '../User/user.interface';

export interface IManagementAccountRequest extends IModelNecessaryFields {
  email: string;
  role: TManagementAccountRegistrationRequestRole;
  expireAt: Date;
  status: TManagementAccountRegistrationRequestStatus;
  by: ObjectId;
  index: 0 | 1;
}

export interface ICreateManagementAccountRequestPayload {
  email: string;
  role: TManagementAccountRegistrationRequestRole;
}

export type TManagementAccountRegistrationRequestRole =
  `${EManagementAccountRegistrationRequestRole}`;

export enum EManagementAccountRegistrationRequestRole {
  ADMIN = EUserRole.ADMIN,
  LIBRARIAN = EUserRole.LIBRARIAN,
}

export type TManagementAccountRegistrationRequestStatus =
  `${EManagementAccountRegistrationRequestStatus}`;

export enum EManagementAccountRegistrationRequestStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface IManagementRegistrationRequestFilterPayload {
  email?: string;
}
