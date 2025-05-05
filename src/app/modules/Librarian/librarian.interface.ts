import { Types } from 'mongoose';
import { IModelNecessaryFields, TGender} from '../../types/model.type';
import { IUser } from '../User/user.interface';
import { TContactInfo, TPermission } from '../../types';

export interface ILibrarian extends IModelNecessaryFields {
  user: Types.ObjectId | IUser;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  about: string;
  contactInfo: TContactInfo;
  permissions: TLibrarianPermissions;
}

export type TLibrarianPermissions = {
  books: TPermission;
  users: TPermission;
  librarians: TPermission;
  admins: TPermission;
  systemSettings: TPermission;
  reports: TPermission;
};
