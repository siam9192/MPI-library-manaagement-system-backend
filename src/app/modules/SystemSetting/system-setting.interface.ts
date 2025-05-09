import { IModelNecessaryFields } from '../../types/model.type';

export interface ISystemSetting extends IModelNecessaryFields {
  maxBorrowDays: number;
  maxBorrowItems: number;
  lateFeePerDay: number;
  borrowRequestExpiryDays: number;
  reservationExpiryDays: number;
  studentRegistrationRequestExpiryDays: number;
  managementRegistrationRequestExpiryDays: number;
  emailVerificationExpiryMinutes: number;
  isActive: boolean;
}

export interface IUpdateSystemSettingPayload {
  maxBorrowDays?: number;
  maxBorrowItems?: number;
  lateFeePerDay?: number;
  borrowRequestExpiryDays: number;
  reservationExpiryDays?: number;
  studentRegistrationRequestExpiryDays?: number;
  managementRegistrationRequestExpiryDays?: number;
  emailVerificationExpiryMinutes?: number;
}
