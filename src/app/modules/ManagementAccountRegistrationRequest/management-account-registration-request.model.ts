import { model, Schema, Types } from 'mongoose';
import {
  EManagementAccountRegistrationRequestRole,
  EManagementAccountRegistrationRequestStatus,
  IManagementAccountRequest,
} from './management-account-registration-request.interface';

const ManagementAccountRegistrationRequestModelSchema = new Schema<IManagementAccountRequest>(
  {
    email: {
      type: String,
      minlength: 3,
      maxlength: 100,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(EManagementAccountRegistrationRequestRole),
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EManagementAccountRegistrationRequestStatus),
      default: EManagementAccountRegistrationRequestStatus.PENDING,
    },
    by: {
      type: Types.ObjectId,
      ref: 'Administrator',
      required: true,
    },
    index: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const ManagementAccountRegistrationRequest = model<IManagementAccountRequest>(
  'ManagementAccountRegistrationRequest',
  ManagementAccountRegistrationRequestModelSchema
);

export default ManagementAccountRegistrationRequest;
