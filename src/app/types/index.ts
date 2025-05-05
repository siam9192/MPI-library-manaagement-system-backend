import { TUserRole } from '../modules/User/user.interface';

export interface IFbDataResponse {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      height: number;
      width: number;
      url: string;
    };
  };
}

export type TEnvironment = `${EEnvironment}`;

export enum EEnvironment {
  Development = 'DEVELOPMENT',
  Production = 'Production',
}

export interface IPaginationOptions {
  page?: string | number;
  limit?: number;
  sortBy?: string | undefined;
  sortOrder?: string;
}

export interface IAuthUser {
  userId: string;
  profileId: string;
  role: TUserRole;
}



export type TPermission = {
  read: boolean;
  write: boolean;
  delete: boolean;
};



export type TContactInfo = {
  emailAddress: string;
  phoneNumber: string;
};
