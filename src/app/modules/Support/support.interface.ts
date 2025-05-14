import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';
import { EManagementRole } from '../User/user.interface';
export interface ISupport extends IModelNecessaryFields {
  student: Types.ObjectId; // Reference to the student
  subject: string; // Short subject or topic
  message: string; // Detailed description of the issue
  status: ESupportStatus;
  resolvedBy?: {
    role: EManagementRole;
    id: Types.ObjectId;
  };
  resolutionNote?: string; // Notes or actions taken to resolve
}

export enum ESupportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface ICreateSupportPayload {
  subject: string; // Short subject or topic
  message: string;
}

export interface ISupportsFilterPayload {
  roll?: string;
  status?: ESupportStatus;
}

export interface IResolveSupportPayload {
  resolutionNote: string;
  sendMail: boolean;
}
