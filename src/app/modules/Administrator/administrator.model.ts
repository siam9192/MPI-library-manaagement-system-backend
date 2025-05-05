import { model, Schema } from 'mongoose';
import { EGender } from '../../types/model.type';
import { IAdministrator } from './administrator.interface';
import { ContactSchema } from '../Librarian/librarian.model';

const AdministratorModelSchema = new Schema<IAdministrator>(
  {
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
    contact: ContactSchema,
  },
  {
    timestamps: true,
  }
);

const Administrator = model<IAdministrator>('Administrator', AdministratorModelSchema);

export default Administrator;
