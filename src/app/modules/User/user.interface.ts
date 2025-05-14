import { IModelNecessaryFields } from '../../types/model.type';
import { EAdministratorLevel } from '../Administrator/administrator.interface';
import { ILibrarian } from '../Librarian/librarian.interface';

import { IStudent } from '../Student/student.interface';

export interface IUser extends IModelNecessaryFields {
  email: string;
  roll?: number;
  password: string;
  role: TUserRole;
  status: TUserStatus;
  lastLoginAt?: Date;
  lastPasswordChangedAt: Date;

}

export type TUserRole = `${EUserRole}`;

export enum EUserRole {
  STUDENT = 'student',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

export enum EManagementRole {
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

export enum EAdministratorRole {
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

export type TUserStatus = `${EUserStatus}`;

export enum EUserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DELETED = 'deleted',
}

export interface IRoleBaseUsersFilterPayload {
  searchTerm?: string;
  status?: EUserStatus;
  level?: EAdministratorLevel;
}

export  interface IUserFiltersPayload {
  email?:string
  status?: EUserStatus;
  role?:EUserRole
}
export type TUpdateMyProfilePayload =
  | TUpdateStudentProfile
  | TUpdateLibrarianProfile
  | TUpdateLibrarianProfile;

export type TUpdateStudentProfile = Partial<
  Pick<IStudent, 'fullName' | 'gender' | 'profilePhotoUrl' | 'phoneNumber' | 'address'>
>;

export type TUpdateLibrarianProfile = Partial<
  Pick<ILibrarian, 'fullName' | 'gender' | 'about' | 'contactInfo'>
>;

export type TUpdateAdministratorProfile = Partial<
  Pick<ILibrarian, 'fullName' | 'gender' | 'contactInfo'>
>;

