import { model, Schema } from 'mongoose';
import { ENotificationAction, ENotificationType, INotification } from './notification.interface';
import e from 'express';

const NotificationModelSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      minlength: 1,
      maxlength: 100,
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
