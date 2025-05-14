import { startSession } from 'mongoose';
import { IAuthUser, IPaginationOptions } from '../../types';
import {
  ESupportStatus,
  ICreateSupportPayload,
  IResolveSupportPayload,
  ISupportsFilterPayload,
} from './support.interface';
import Support from './support.model';
import Notification from '../Notification/notification.model';
import { ENotificationAction, ENotificationType } from '../Notification/notification.interface';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import { calculatePagination } from '../../helpers/paginationHelper';
import { z } from 'zod';
import { EManagementRole } from '../User/user.interface';
import Librarian from '../Librarian/librarian.model';
import Administrator from '../Administrator/administrator.model';
import { isValidObjectId, objectId } from '../../helpers';
import { IStudent } from '../Student/student.interface';

class SupportService {
  async createSupportIntoDB(authUser: IAuthUser, payload: ICreateSupportPayload) {
    const data = {
      student: authUser.profileId,
      subject: payload.subject,
      message: payload.message,
    };
    const session = await startSession();
    session.startTransaction();

    try {
      const [createdSupport] = await Support.create([data], { session });
      if (!createdSupport) throw new Error();

      const [createdNotification] = await Notification.create(
        [
          {
            user: authUser.userId,
            message: "Thanks for reaching out! We'll look into your message and respond shortly.",
            type: ENotificationType.SUCCESS,
          },
        ],
        { session }
      );
      if (!createdNotification) {
        throw new Error();
      }
      await session.commitTransaction();
      return createdSupport;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
    } finally {
      await session.endSession();
    }
  }

  async getSupportsFromDB(
    filterPayload: ISupportsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { roll, status } = filterPayload;

    const whereConditions: any = {};

    // If roll is provided and is a valid number, apply it

    if (roll) {
      if (!z.number().int().safeParse(parseInt(roll)).success) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid roll number');
      }
      whereConditions['student.roll'] = parseInt(roll);
    }

    // If status is provided and it'a valid status then applied it

    if (status && Object.values(ESupportStatus).includes(status)) {
      whereConditions.status = status;
    }
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    let supports;
    let totalResult;
    if (roll) {
      const supportPipeline = Support.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $unwind: '$student',
        },
        {
          $match: whereConditions,
        },

        {
          $sort: {
            [sortBy]: sortOrder,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const totalResultCountPipeline = Support.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $unwind: '$student',
        },

        {
          $match: whereConditions,
        },
        {
          $count: 'total',
        },
      ]);

      [supports, totalResult] = await Promise.all([supportPipeline, totalResultCountPipeline]);
      totalResult = (totalResult as { total: number }[])[0].total;
    } else {
      supports = await Support.find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({
          [sortBy]: sortOrder,
        });
      totalResult = await Support.countDocuments(whereConditions);
    }

    const total = await Support.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: supports,
      meta,
    };
  }

  async getSupportByIdFromDB(id: string) {
    const support = await Support.findById(id);
    if (!support) {
      throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
    }

    let resolvedBy = null;

    if (support.status === ESupportStatus.RESOLVED && support.resolvedBy) {
      const role = support.resolvedBy.role;

      if (role === EManagementRole.LIBRARIAN) {
        resolvedBy = (await Librarian.findById(support.resolvedBy.id))?.toObject();
      } else {
        resolvedBy = (await Administrator.findById(support.resolvedBy.id))?.toObject();
      }
    }

    return {
      ...support.toObject(),
      resolvedBy: resolvedBy
        ? {
            ...resolvedBy,
            role: support.resolvedBy?.role,
          }
        : support.resolvedBy,
      // include detailed user info if available
    };
  }

  async getMySupportByIdFromDB(authUser: IAuthUser, id: string) {
    const support = await Support.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    });
    if (!support) {
      throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
    }

    let resolvedBy = null;

    if (support.status === ESupportStatus.RESOLVED && support.resolvedBy) {
      const role = support.resolvedBy.role;

      if (role === EManagementRole.LIBRARIAN) {
        resolvedBy = (
          await Librarian.findById(support.resolvedBy.id).select('_id fullName profilePhoto')
        )?.toObject();
      } else {
        resolvedBy = (
          await Administrator.findById(support.resolvedBy.id).select('_id fullName profilePhoto')
        )?.toObject();
      }
    }

    return {
      ...support.toObject(),
      resolvedBy: resolvedBy
        ? {
            ...resolvedBy,
            role: support.resolvedBy?.role,
          }
        : support.resolvedBy,
      // include detailed user info if available
    };
  }

  async resolveSupportIntoDB(authUser: IAuthUser, id: string, payload: IResolveSupportPayload) {
    // Id validation
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }
    const support = await Support.findById(id).populate('student');
    if (!support) {
      throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
    }

    // Check if the support is already resolved
    if ([ESupportStatus.RESOLVED, ESupportStatus.FAILED].includes(support.status)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Support can not be resolved because it's already processed"
      );
    }

    const student = support.student as any as IStudent;
    const session = await startSession();
    session.startTransaction();

    try {
      const supportUpdateStatus = await Support.updateOne(
        { _id: support._id },
        {
          status: ESupportStatus.RESOLVED,
          resolutionNote: payload.resolutionNote,
          resolvedBy: {
            id: authUser.profileId,
            role: authUser.role,
          },
        },
        { session }
      );

      if (!supportUpdateStatus.modifiedCount) {
        throw new Error();
      }

      await Notification.create(
        [
          {
            user: student.user,
            message: `Your support request regarding [${support.subject}] has been resolved. If you have any further concerns, feel free to contact us again.`,
            type: ENotificationType.INFO,
            action: ENotificationAction.LINK_VISIT,
            metaData: {
              supportId: support._id,
            },
          },
        ],
        { session }
      );
      return await Support.findById(id);
    } catch (error) {
      await session.commitTransaction();
    } finally {
      await session.endSession();
    }
  }

  async setSupportAsFailedIntoDB(authUser: IAuthUser, id: string) {
    const support = await Support.findById(id).populate('student');

    if (!support) {
      throw new AppError(httpStatus.NOT_FOUND, 'Support request not found');
    }

    // Check if the support is already resolved
    if (support.status !== ESupportStatus.PENDING) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Support can not be resolved because it's already processed"
      );
    }

    const student = support.student as any as IStudent;
    const session = await startSession();
    session.startTransaction();

    try {
      const supportUpdateStatus = await Support.updateOne(
        { _id: support._id },
        {
          status: ESupportStatus.FAILED,
        },
        { session }
      );

      if (!supportUpdateStatus.modifiedCount) {
        throw new Error();
      }

      await Notification.create(
        [
          {
            user: student.user,
            message: `Your support request regarding [${support.subject}] has been resolved. If you have any further concerns, feel free to contact us again.`,
            type: ENotificationType.INFO,
            action: ENotificationAction.LINK_VISIT,
            metaData: {
              supportId: support._id,
            },
          },
        ],
        { session }
      );

      return await Support.findById(id);
    } catch (error) {
      await session.commitTransaction();
    } finally {
      await session.endSession();
    }
  }
}

export default new SupportService();
