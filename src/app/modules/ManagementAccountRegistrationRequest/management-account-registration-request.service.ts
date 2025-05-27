import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import systemSettingService from '../SystemSetting/system-setting.service';
import User from '../User/user.model';
import {
  EManagementAccountRegistrationRequestStatus,
  ICreateManagementAccountRequestPayload,
  IManagementRegistrationRequestFilterPayload,
} from './management-account-registration-request.interface';
import ManagementAccountRegistrationRequest from './management-account-registration-request.model';
import jwtHelpers from '../../helpers/jwtHelpers';
import envConfig from '../../config/env.config';
import { calculatePagination } from '../../helpers/paginationHelper';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EManagementRegistrationAction } from '../AuditLog/audit-log.interface';
import Notification from '../Notification/notification.model';
import { ENotificationCategory, ENotificationType } from '../Notification/notification.interface';
import { IAdministrator } from '../Administrator/administrator.interface';

class ManagementAccountRegistrationService {
  async createRegistrationRequest(
    authUser: IAuthUser,
    payload: ICreateManagementAccountRequestPayload
  ) {
    //  Check if the email is already used
    const existingUserByEmail = await User.findOne({ email: payload.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This email is already used, try another one');
    }

    // Fetch current system settings
    const setting = await systemSettingService.getCurrentSettings();

    // Insert data into db
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + setting.registrationPolicy.managementRequestExpiryDays); //Set expire date 7 days

    const session = await startSession();

    session.startTransaction();

    try {
      const [createdRequest] = await ManagementAccountRegistrationRequest.create(
        [
          {
            email: payload.email,
            role: payload.role,
            expireAt,
            by: authUser.profileId,
          },
        ],
        { session }
      );
      if (!createdRequest) {
        throw new Error();
      }

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.MANAGEMENT_REGISTRATION,
            action: EManagementRegistrationAction.CREATE,
            description: `Requested management account registration for the "${createdRequest.role}" role to ${createdRequest.email}`,
            targetId: createdRequest._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      const tokenPayload = {
        requestId: createdRequest._id,
      };
      const token = jwtHelpers.generateToken(
        tokenPayload,
        envConfig.jwt.registrationVerificationTokenSecret as string,
        `${setting}d`
      );
      await session.commitTransaction();

      return {
        token,
      };
    } catch (error) {
      await session.abortTransaction();

      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
    } finally {
      await session.endSession();
    }
  }

  async getRegistrationRequests(
    filterPayload: IManagementRegistrationRequestFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { email } = filterPayload;

    // Initialize query conditions for filtering
    const whereConditions: Record<string, string> = {};

    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    // Apply email filter if provided
    if (email) {
      whereConditions.email = email;
    }

    // Fetch the filtered and paginated data with sorting
    const data = await ManagementAccountRegistrationRequest.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
        index: 1, // Static sort priority (optional; consider if this is intended)
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await ManagementAccountRegistrationRequest.countDocuments(whereConditions);

    const total = await ManagementAccountRegistrationRequest.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    // Return both the data and the metadata
    return {
      data,
      meta,
    };
  }

  async getRegistrationRequestById(id: string) {
    const request = await ManagementAccountRegistrationRequest.findById(id);
    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'No request found!');
    }
    return request;
  }

  async resendLink(id: string) {
    const request = await ManagementAccountRegistrationRequest.findById(id);
    // Check if request not found
    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
    }

    // Check is request not pending
    if (request.status !== EManagementAccountRegistrationRequestStatus.PENDING) {
      throw new AppError(
        httpStatus.NOT_ACCEPTABLE,
        `The request is already ${request.status.charAt(0).toUpperCase()}${request.status.slice(1)}`
      );
    }

    const tokenPayload = {
      requestId: request._id,
    };

    const availableTime = new Date(request.expireAt).getTime() - new Date().getTime();
    const convertTime = (ms: number) => {
      const minutes = Math.floor(ms / (1000 * 60)) % 60;
      const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      if (days) return `${days + 1}d`;
      else if (hours) return `${hours}h`;
      else return `${minutes}m`;
    };

    const token = jwtHelpers.generateToken(
      tokenPayload,
      envConfig.jwt.registrationVerificationTokenSecret as string,
      convertTime(availableTime)
    );

    return {
      token,
    };
  }

  async cancelRegistrationRequest(authUser: IAuthUser, id: string) {
    // Step 1: Find the registration request by ID
    const request = await ManagementAccountRegistrationRequest.findById(id);

    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
    }

    // Step 2: Check if request is already finalized (REJECTED, APPROVED, or EXPIRED)
    const { REJECTED, CANCELED, SUCCESSFUL, EXPIRED } = EManagementAccountRegistrationRequestStatus;

    switch (request.status) {
      case CANCELED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already canceled'
        );

      case REJECTED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already rejected'
        );
      case SUCCESSFUL:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration successful is already approved'
        );
      case EXPIRED:
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is expired');
    }

    const session = await startSession();

    session.startTransaction();

    try {
      // Step 3: Update the request status to REJECTED with reason
      const updateRequestStatus = await ManagementAccountRegistrationRequest.updateOne(
        { _id: request._id },
        {
          status: CANCELED,
          index: 0,
        }
      );

      if (!updateRequestStatus.modifiedCount) throw new Error('Request update failed');

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.MANAGEMENT_REGISTRATION,
            action: EManagementRegistrationAction.CANCEL,
            description: `Canceled management registration request ID:${request._id}`,
            targetId: request._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Request cancel failed.Internal server error'
      );
    } finally {
      await session.endSession();
    }
  }

  async rejectRegistrationRequest(id: string) {
    // Step 1: Find the registration request by ID
    const request = await ManagementAccountRegistrationRequest.findById(id).populate('by');

    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
    }
    // Step 2: Check if request is already finalized (REJECTED, APPROVED, or EXPIRED)
    const { REJECTED, CANCELED, SUCCESSFUL, EXPIRED } = EManagementAccountRegistrationRequestStatus;

    switch (request.status) {
      case CANCELED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already canceled'
        );
      case REJECTED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already rejected'
        );
      case SUCCESSFUL:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration successful is already approved'
        );
      case EXPIRED:
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is expired');
    }

    const by = request.by as any as IAdministrator;

    // Step 3: Update the request status to REJECTED with reason
    const updateResult = await ManagementAccountRegistrationRequest.updateOne(
      { _id: request._id },
      {
        status: REJECTED,
        index: 0,
      }
    );

    Notification.create({
      user: by.user,
      category: ENotificationCategory.MANAGEMENT_ACCOUNT_REGISTRATION,
      type: ENotificationType.INFO,
      title: 'Management registration request Rejected',
      message: `The request to register a management account with the "${request.role}" role for "${request.email}" has been rejected.`,
    });
    if (!updateResult.modifiedCount) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, '');
  }
}

export default new ManagementAccountRegistrationService();
