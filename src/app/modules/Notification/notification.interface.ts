import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface INotification extends IModelNecessaryFields {
  user: Types.ObjectId;
  message: string;
  type: ENotificationType;
  action: ENotificationAction;
  metaData?: Record<string, unknown>;
  isRead: boolean;
}

export enum ENotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system'
}

export enum ENotificationAction {
  DROP_REVIEW = 'drop_review',
  DOWNLOAD_TICKET = 'download_ticket',
  LINK_VISIT = 'link_visit',
  NONE = 'none',
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
