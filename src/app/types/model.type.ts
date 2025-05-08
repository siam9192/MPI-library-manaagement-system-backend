import { Types } from 'mongoose';

export type TModelTimeStamps = {
  createdAt: Date;
  updatedAt: Date;
};

export type TGender = `${EGender}`;

export enum EGender {
  MALE = 'male',
  FEMALE = 'female',
}

export type TSemester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface IModelNecessaryFields extends TModelTimeStamps {
  _id: Types.ObjectId;
}

export type TUserAddress = {
  present?: TAddress;
  permanent?: TAddress;
  presentIsPermanent?: boolean;
};

export type TAddress = {
  street: string;
  city: string;
  district: string;
  country: string;
};

export type TContactInfo = {
  emailAddress: string;
  phoneNumber: string;
};
