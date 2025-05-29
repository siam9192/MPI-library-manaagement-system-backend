import { z } from 'zod';
import AppError from '../../Errors/AppError';
import { objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EUserRole, EUserStatus } from '../User/user.interface';
import User from '../User/user.model';
import {
  ENotificationAction,
  ENotificationType,
  ICreateNotificationPayload,
  INotificationsFilterPayload,
} from './notification.interface';
import Notification from './notification.model';
import { ClientSession, SessionOperation, Types } from 'mongoose';

class NotificationService {
  async notify(
    userId: string,
    payload: {
      message: string;
      type: ENotificationType;
      action?: ENotificationAction;
      metaData?: Record<string, unknown>;
    },
    session?: ClientSession
  ) {
    const userExist = User.findOne({ _id: objectId(userId), status: EUserStatus.ACTIVE });

    if (!userExist) {
      throw new Error('Notification failed User not found');
    }

    // Init data
    const notificationData: any = {
      user: userId,
      message: payload.message,
      type: payload.type,
    };

    // If action type  exist then append it with main data
    if (payload.action) {
      notificationData.action = payload.action;
    }
    // If meta data exist then append it with main data
    if (payload.metaData) {
      notificationData.metaData = payload.metaData;
    }

    let createdNotification;

    /*
   If session exist then create with session
   otherwise create it normal way
  */
    if (session) {
      [createdNotification] = await Notification.create([notificationData], { session });
    } else {
      createdNotification = await Notification.create(notificationData);
    }
    return createdNotification;
  }

  async getMyNotificationsFromDB(authUser: IAuthUser) {
    const notifications = await Notification.find({
      user: objectId(authUser.userId),
    }).sort({
      createdAt: -1,
      isRead: -1,
    });

    return notifications;
  }

  async createNotificationIntoDB(authUser:IAuthUser,payload: ICreateNotificationPayload) {

    const user = await User.findOne({
      _id: objectId(payload.userId),
      status: {
        $ne: EUserStatus.DELETED,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    if(authUser.role ===  EUserRole.ADMIN && user.role === EUserRole.SUPER_ADMIN){
      throw new AppError(httpStatus.FORBIDDEN,"Permission not available")
    }
    return await Notification.create({
      user: objectId(payload.userId),
      type: payload.type,
      message: payload.message,
    });
  }

  async getNotificationsFromDB(
    filterPayload: INotificationsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, status, userId, startDate, endDate } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {};

    //  If searchTerm provided  then apply it

    if (searchTerm) {
      whereConditions.message = { $regex: searchTerm, $options: 'i' };
    }

    // If read status us provided read =  true unread = false
    if (status && ['read', 'unread'].includes(status)) {
      whereConditions.isRead = status === 'read';
    }

    //  if(userId && Types.ObjectId.isValid(userId)){
    //     whereConditions.user =  objectId(userId)
    //  }

    // Fetch all matched  authors  with  pagination and sorting
    const notifications = await Notification.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Notification.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: notifications,
      meta,
    };
  }

  async setMyNotificationsAsReadIntoDB(payload: { ids: string[] }) {
    const { ids } = payload;
    const validateIds = ids.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(httpStatus.FORBIDDEN, 'Invalid id found');
      }
      return objectId(id);
    });

    const updateStatus = await Notification.updateMany(
      {
        _id: {
          $in: validateIds,
        },
      },
      { isRead: true }
    );
    if (!updateStatus.modifiedCount) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!Notifications could not be set as read.'
      );
    }
    return null;
  }
}

export default new NotificationService();
