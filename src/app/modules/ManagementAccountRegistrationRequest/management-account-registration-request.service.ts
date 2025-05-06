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

class ManagementAccountRegistrationService {
  async createRegistrationRequest(payload: ICreateManagementAccountRequestPayload) {
    //  Check if the email is already used
    const existingUserByEmail = await User.findOne({ email: payload.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This email is already used, try another one');
    }

    // Fetch current system settings
    const settings = await systemSettingService.getCurrentSettings();

    // Insert data into db
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + settings.managementRegistrationRequestExpiryDays); //Set expire date 7 days

    const session = await startSession();

    session.startTransaction();

    try {
      const [createdRequest] = await ManagementAccountRegistrationRequest.create(
        [
          {
            email: payload.email,
            role: payload.role,
            expireAt,
          },
        ],
        { session }
      );
      if (!createdRequest) {
        throw new Error();
      }
      const tokenPayload = {
        requestId: createdRequest._id,
      };
      const token = jwtHelpers.generateToken(
        tokenPayload,
        envConfig.jwt.registrationVerificationTokenSecret as string,
        `${settings.managementRegistrationRequestExpiryDays}d`
      );
      await session.commitTransaction();
      await session.endSession();
      return {
        token,
      };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
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

    // Step 3: Update the request status to REJECTED with reason
    const updateResult = await ManagementAccountRegistrationRequest.updateOne(
      { _id: request._id },
      {
        status: CANCELED,
        index: 0,
      }
    );

    if (!updateResult.modifiedCount) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, '');
  }

  async rejectRegistrationRequest(authUser: IAuthUser, id: string) {
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
    // Step 3: Update the request status to REJECTED with reason
    const updateResult = await ManagementAccountRegistrationRequest.updateOne(
      { _id: request._id },
      {
        status: REJECTED,
        index: 0,
      }
    );

    if (!updateResult.modifiedCount) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, '');
  }
}

export default new ManagementAccountRegistrationService();
