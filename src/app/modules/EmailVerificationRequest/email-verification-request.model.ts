import { model, Schema } from 'mongoose';
import { IEmailVerificationRequest } from './email-verification-request.interface';
import { EEmailVerificationRequestStatus } from '../../type';

const EmailVerificationModelSchema = new Schema<IEmailVerificationRequest>(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      minlength: 6,
      maxlength: 6,
      required: true,
    },
    otpResendCount: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    expireAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EEmailVerificationRequestStatus),
      default: EEmailVerificationRequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const EmailVerification = model<IEmailVerificationRequest>(
  'EmailVerification',
  EmailVerificationModelSchema
);

export default EmailVerification;
