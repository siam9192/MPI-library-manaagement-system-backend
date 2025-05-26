import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface INotification extends IModelNecessaryFields {
  user: Types.ObjectId;
  message: string;
  type: ENotificationType;
  action: ENotificationAction;
  category: ENotificationCategory;
  metaData?: Record<string, unknown>;
  isRead: boolean;
}

export enum ENotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
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

export enum ENotificationCategory {
  SYSTEM = 'system',
  DEPARTMENT = 'department',
  AUTHOR = 'author',
  GENRE = 'genre',
  USER = 'user',
  STUDENT_REGISTRATION = 'student_registration',
  MANAGEMENT_ACCOUNT_REGISTRATION = ' management_account_registration',
  FOLLOW = 'follow',
  BOOK = 'user',
  BOOK_REVIEW = 'book_review',
  BORROW_REQUEST = 'borrow_request',
  WAITLIST = 'waitlist',
  RESERVATION = 'reservation',
  BORROW = 'borrow',
  FINE = 'fine',
  WISHLIST = 'wishlist',
  SUPPORT = 'support',
  SYSTEM_SETTING = 'system_setting',
}
