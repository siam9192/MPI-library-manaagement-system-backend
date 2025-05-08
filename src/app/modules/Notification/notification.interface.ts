import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface INotification extends IModelNecessaryFields {
  user: Types.ObjectId;
  message: string;
  type: ENotificationType;
  isRead: boolean;
}

export enum ENotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface ICreateNotificationPayload {
  userId: string;
  message: string;
  type: ENotificationType;
}

export interface INotificationsFilterPayload {
  searchTerm?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'read' | 'unread';
}
