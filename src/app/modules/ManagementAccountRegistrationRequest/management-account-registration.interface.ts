import { IModelNecessaryFields } from '../../types/model.type';
import { EUserRole } from '../User/user.interface';

export interface IManagementAccountRequest extends IModelNecessaryFields {
  email: string;
  role: TManagementAccountRegistrationRequestRole;
  secret: string;
  expireAt: Date;
  status: TManagementAccountRegistrationRequestStatus;
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
  MODERATOR = EUserRole.MODERATOR,
  LIBRARIAN = EUserRole.LIBRARIAN,
}

export type TManagementAccountRegistrationRequestStatus =
  `${EManagementAccountRegistrationRequestStatus}`;

export enum EManagementAccountRegistrationRequestStatus {
  PENDING = 'Pending',
  SUCCESSFUL = 'Successful',
  CANCELED = 'Canceled',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

export interface IManagementRegistrationRequestFilterPayload {
  searchTerm?: string;
}
