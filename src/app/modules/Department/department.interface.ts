import { Types } from 'mongoose';
import { IModelNecessaryFields, TModelTimeStamps } from '../../types/model.type';

export interface IDepartment extends IModelNecessaryFields {
  name: string;
  shortName: string;
  status: TDepartmentStatus;
}

export type TDepartmentStatus = `${EDepartmentStatus}`;

export enum EDepartmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface ICreateDepartmentPayload {
  name: string;
  shortName: string;
}

export interface IPublicDepartmentsFilterPayload {
  searchTerm?: string;
}

export interface IDepartmentsFilterPayload {
  searchTerm?: string;
  status?: TDepartmentStatus;
}
