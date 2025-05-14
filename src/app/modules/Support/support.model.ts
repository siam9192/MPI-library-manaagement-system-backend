import { model, Schema } from 'mongoose';
import { ESupportStatus, ISupport } from './support.interface';
import { EAdministratorRole, EManagementRole } from '../User/user.interface';

const SupportModelSchema = new Schema<ISupport>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: {
      type: String,
      minlength: 1,
      maxlength: 100,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      minlength: 1,
      maxlength: 1000,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ESupportStatus),
      default: ESupportStatus.PENDING,
    },
    resolvedBy: {
      type: {
        role: {
          type: String,
          enum: Object.values(EManagementRole),
          required: true,
        },
        id: {
          type: Schema.Types.ObjectId,
          required: true,
        },
      },
      default: null,
    },
    resolutionNote: {
      type: String,
      min: 1,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Support = model<ISupport>('support', SupportModelSchema);

export default Support;
