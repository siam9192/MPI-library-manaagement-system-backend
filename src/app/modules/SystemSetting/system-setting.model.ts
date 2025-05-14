import mongoose, { Schema, Document } from 'mongoose';
import { ISystemSetting } from './system-setting.interface';

const SystemSettingModelSchema: Schema = new Schema<ISystemSetting>(
  {
    maxBorrowDays: { type: Number, min: 1, required: true },
    maxBorrowItems: { type: Number, min: 1, required: true },
    lateFeePerDay: { type: Number, min: 1, required: true },
    borrowRequestExpiryDays: { type: Number, min: 1, required: true },
    reservationExpiryDays: { type: Number, min: 1, required: true },
    lostReputationOnCancelReservation: { type: Number, min: 0, required: true },
    studentRegistrationRequestExpiryDays: { type: Number, min: 1, required: true },
    managementRegistrationRequestExpiryDays: { type: Number, min: 1, required: true },
    emailVerificationExpiryMinutes: { type: Number, min: 1, required: true },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model<ISystemSetting>(
  'SystemSetting',
  SystemSettingModelSchema
);
