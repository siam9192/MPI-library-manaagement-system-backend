import { Types } from 'mongoose';
import { TGender, TModelTimeStamps } from '../../types/model.type';
import { EUserRole } from '../User/user.interface';

export interface IAdministrator extends TModelTimeStamps {
  _id: Types.ObjectId;
  userId: string;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  role: TAdministratorRole;
  contact: Contact;
}

export type TAdministratorRole = `${EAdministratorRole}`;

export enum EAdministratorRole {
  SUPER_ADMIN = EUserRole.SUPER_ADMIN,
  ADMIN = EUserRole.ADMIN,
  MODERATOR = EUserRole.MODERATOR,
}

type Contact = {
  emailAddress: string;
  phoneNumber: string;
};
