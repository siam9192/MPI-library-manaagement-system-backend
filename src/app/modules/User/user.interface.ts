import { IModelNecessaryFields } from "../../types/model.type";

export interface IUser extends IModelNecessaryFields {
  email: string;
  roll?: number;
  password: string;
  role: TUserRole;
  status: TUserStatus;
  lastLoginAt?: Date;
  lastPasswordChangedAt:Date
}

export type TUserRole = `${EUserRole}`;


export enum EUserRole {
  STUDENT = 'student',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}


export type TUserStatus = `${EUserStatus}`;

export enum EUserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DELETED = 'deleted'
}
