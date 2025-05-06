import { model, Schema, Types } from 'mongoose';
import { EGender } from '../../types/model.type';
import { IAdministrator } from './administrator.interface';
import { ContactInfoSchema, PermissionSchema } from '../../schemas';

const AdministratorModelSchema = new Schema<IAdministrator>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String,
      minlength: 3,
      maxlength: 30,
      required: true,
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(EGender),
      required: true,
    },
    contactInfo: ContactInfoSchema
  },
  {
    timestamps: true,
  }
);

const Administrator = model<IAdministrator>('Administrator', AdministratorModelSchema);

export default Administrator;
