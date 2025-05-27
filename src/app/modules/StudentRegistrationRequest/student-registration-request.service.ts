import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import {
  EStudentRegistrationRequestStatus,
  IRejectStudentRegistrationRequestPayload,
  IStudentRegistrationRequestFilterPayload,
} from './student-registration-request.interface';
import StudentRegistrationRequest from './studentRegistrationRequest.model';
import User from '../User/user.model';
import { Student } from '../Student/student.model';
import { IAuthUser, IPaginationOptions } from '../../types';
import { calculatePagination } from '../../helpers/paginationHelper';
import { EUserRole } from '../User/user.interface';
import notificationService from '../Notification/notification.service';
import { ENotificationType } from '../Notification/notification.interface';
import Notification from '../Notification/notification.model';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EStudentRegistrationAction } from '../AuditLog/audit-log.interface';
import { throwInternalError, validateObjectId } from '../../helpers';

class StudentRegistrationRequestService {
  async getAllStudentRegistrationRequestsFromDB(
    filterPayload: IStudentRegistrationRequestFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm } = filterPayload;

    // Calculate pagination parameters: page, skip, limit, sortBy, sortOrder
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    // Initialize filter with default condition: only email-verified requests
    const andConditions: Record<string, any> = {
      isEmailVerified: true,
    };

    // Apply searchTerm filtering
    if (searchTerm) {
      // If the searchTerm is a number, treat it as a roll number
      if (!isNaN(parseInt(searchTerm))) {
        andConditions.roll = parseInt(searchTerm);
      } else {
        // Otherwise, treat it as a name and apply case-insensitive regex
        andConditions.name = { $regex: searchTerm, options: 'i' };
      }
    }

    // Fetch filtered and paginated registration requests
    const requests = await StudentRegistrationRequest.find(andConditions)
      .sort({ index: -1, [sortBy]: sortOrder }) // Sort by requested field and preserve original order
      .skip(skip)
      .limit(limit);

    // Count of filtered results (after applying filters)
    const totalResult = await StudentRegistrationRequest.countDocuments(andConditions);

    // Count of all registration requests (without any filters)
    const total = await StudentRegistrationRequest.countDocuments();

    // Metadata for pagination response
    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: requests,
      meta,
    };
  }

  async rejectRequestIntoDB(
    authUser: IAuthUser,
    id: string,
    payload: IRejectStudentRegistrationRequestPayload
  ) {
    // Validate id 
    validateObjectId(id)
    

    const { rejectReason } = payload;

    // Find the registration request by ID
    const request = await StudentRegistrationRequest.findById(id);

    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
    }

    //  Check if request is already finalized (REJECTED, APPROVED, or EXPIRED)
    const { REJECTED, APPROVED, EXPIRED } = EStudentRegistrationRequestStatus;

    switch (request.status) {
      case REJECTED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already rejected'
        );
      case APPROVED:
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'This registration request is already approved'
        );
      case EXPIRED:
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is expired');
    }

    // Start a database session for transaction
    const session = await startSession();
    session.startTransaction();

    try {
      //  Update the request status to REJECTED with reason
      const updateResult = await StudentRegistrationRequest.updateOne(
        { _id: request._id },
        {
          status: REJECTED,
          rejectReason,
          index: 0,
        },
        { session }
      );

      if (!updateResult.modifiedCount) {
        throw new Error();
      }

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.STUDENT_REGISTRATION,
            action: EStudentRegistrationAction.APPROVE,
            description: 'Approve student registration request',
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
      return null;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed Reject the request');
    } finally {
      await session.endSession();
    }

    
  }

  async approveRequestIntoDB(authUser: IAuthUser, id: string) {

    // Validate id 
    validateObjectId(id)

    // Fetch the registration request by ID
    const request = await StudentRegistrationRequest.findById(id);

    // Throw error if request doesn't exist
    if (!request) {
      throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
    }

    const { status } = request;

    // Throw error if request is already rejected
    if (status === EStudentRegistrationRequestStatus.REJECTED) {
      throw new AppError(
        httpStatus.NOT_ACCEPTABLE,
        'This registration request is already rejected'
      );
    }

    // Throw error if request is already approved
    if (status === EStudentRegistrationRequestStatus.APPROVED) {
      throw new AppError(
        httpStatus.NOT_ACCEPTABLE,
        'This registration request is already approved'
      );
    }

    // Throw error if request is expired
    if (status === EStudentRegistrationRequestStatus.EXPIRED) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is expired');
    }

    //  Check if roll number is already registered
    const existingUserByRoll = await User.findOne({ roll: request.roll });
    if (existingUserByRoll) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This student is already registered');
    }

    //  Check if email is already used
    const existingUserByEmail = await User.findOne({ email: request.email });
    if (existingUserByEmail) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'The provided email is already used');
    }

    // Start a database session for transaction
    const session = await startSession();
    session.startTransaction();

    try {
      // Update request status to APPROVED
      const updateStatus = await StudentRegistrationRequest.updateOne(
        { _id: request._id },
        { status: EStudentRegistrationRequestStatus.APPROVED, index: 0 },
        { session }
      );

      // If update failed, throw an error
      if (updateStatus.modifiedCount === 0) {
        throw new Error('Failed to update request status');
      }

      // Create a new User with data from the request
      const [createdUser] = await User.create(
        [
          {
            roll: request.roll,
            role: EUserRole.STUDENT,
            email: request.email,
            password: request.password,
          },
        ],
        { session }
      );

      // If user creation failed, throw an error
      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      // Create a new Student profile with data from the request
      const [createdStudent] = await Student.create(
        [
          {
            user: createdUser._id,
            fullName: request.fullName,
            roll: request.roll,
            gender: request.gender,
            department: request.department,
            currentSemester: request.semester,
            shift: request.shift,
            session: request.session,
          },
        ],
        { session }
      );

      // If student creation failed, throw an error
      if (!createdStudent) {
        throw new Error('Failed to create student');
      }

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.STUDENT_REGISTRATION,
            action: EStudentRegistrationAction.APPROVE,
            description: 'Approve student registration request',
            targetId: request._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      // Send notification (non-blocked)
      Notification.create({
        user: createdUser._id,
        type: ENotificationType.SYSTEM,
        message: "Hey welcome,Thanks for joining MPI library. We're glad to have you here!",
      });

      // Commit the transaction if everything succeeded
      await session.commitTransaction();
      // End the database session

      return null;
    } catch (error) {
         
      // Rollback transaction in case of error
      await session.abortTransaction();
      // End the database session
       throwInternalError()
    } finally {
      await session.endSession();
    }
  }
}

export default new StudentRegistrationRequestService();
