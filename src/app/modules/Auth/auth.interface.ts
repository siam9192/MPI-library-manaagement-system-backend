import { TGender, TSemester } from '../../types/model.type';
import { TShift } from '../Student/student.interface';

export interface ICreateStudentRegistrationRequestPayload {
  fullName: string;
  gender: TGender;
  roll: number;
  email: string;
  departmentId: string;
  semester: TSemester;
  shift: TShift;
  session: string;
  password: string;
}

export interface IStudentRegistrationRequestTokenPayload {
  email: string;
  verificationId: string;
  requestId: string;
}

export interface IStudentLoginPayload {
  roll: number;
  password: string;
}

export interface IManagementLoginData {
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface IRegisterManagementAccount {
  fullName: string;
  password: string;
  gender: TGender;
  profilePhotoUrl: string;
  about?: string;
  contact: {
    emailAddress: string;
    phoneNumber: string;
  };
}
