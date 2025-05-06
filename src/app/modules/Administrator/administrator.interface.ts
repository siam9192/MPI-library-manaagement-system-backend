import { Types } from 'mongoose';
import { TGender, TModelTimeStamps } from '../../types/model.type';
import { EUserRole } from '../User/user.interface';
import { TContactInfo, TPermission } from '../../types';

export interface IAdministrator extends TModelTimeStamps {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  level: TAdministratorLevel;
  contactInfo: TContactInfo;
}

export type TAdministratorLevel = `${EAdministratorLevel}`;

export enum EAdministratorLevel {
  SUPER_ADMIN = EUserRole.SUPER_ADMIN,
  ADMIN = EUserRole.ADMIN,
}

export type TAdministratorPermissions = {
  books: TPermission;
  users: TPermission;
  librarians: TPermission;
  admins: TPermission;
  auditLogs: TPermission;
  settings: TPermission;
  reports: TPermission;
};
