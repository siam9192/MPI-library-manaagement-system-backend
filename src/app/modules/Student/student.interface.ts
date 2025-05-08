import { Types } from 'mongoose';
import {
  IModelNecessaryFields,
  TGender,
  TModelTimeStamps,
  TUserAddress,
} from '../../types/model.type';
import { IUser } from '../User/user.interface';

export interface IStudent extends IModelNecessaryFields {
  user: Types.ObjectId | IUser;
  fullName: string;
  roll: number;
  gender: TGender;
  profilePhotoUrl: string;
  department: Types.ObjectId;
  currentSemester: number;
  shift: TShift;
  session: string;
  phoneNumber?: string;
  address?: TUserAddress;
  reputationIndex: number;
}
export type TShift = `${EShift}`;

export enum EShift {
  MORNING = 'morning',
  DAY = 'day',
}
