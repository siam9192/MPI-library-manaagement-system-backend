import { Types } from 'mongoose';
import { IModelNecessaryFields, TContactInfo, TGender } from '../../types/model.type';
import { IUser } from '../User/user.interface';

export interface ILibrarian extends IModelNecessaryFields {
  user: Types.ObjectId | IUser;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  about: string;
  contactInfo: TContactInfo;
}
