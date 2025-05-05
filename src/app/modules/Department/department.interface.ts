import { Types } from 'mongoose';
import { TModelTimeStamps } from '../../types/model.type';

export interface IDepartment extends TModelTimeStamps {
  _id: Types.ObjectId;
  name: string;
  shortName: string;
  status: TDepartmentStatus;
}

export type TDepartmentStatus = `${EDepartmentStatus}`;

export enum EDepartmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'Inactive',
}

export interface ICreateDepartmentPayload {
  name: string;
  shortName: string;
}
