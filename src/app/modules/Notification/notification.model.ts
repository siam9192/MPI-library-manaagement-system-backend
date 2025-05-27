import { model, Schema } from 'mongoose';
import {
  ENotificationAction,
  ENotificationCategory,
  ENotificationType,
  INotification,
} from './notification.interface';
import e from 'express';

const NotificationModelSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    message: {
      type: String,
      minlength: 1,
      maxlength: 300,
      trim: true,
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(ENotificationType),
      required: true,
    },

    action: {
      type: String,
      enum: Object.values(ENotificationAction),
      default: ENotificationAction.NONE,
    },
    category: {
      type: String,
      enum: Object.values(ENotificationCategory),
      default: ENotificationCategory.SYSTEM,
    },
    metaData: {
      type: Object,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = model<INotification>('Notification', NotificationModelSchema);

export default Notification;
