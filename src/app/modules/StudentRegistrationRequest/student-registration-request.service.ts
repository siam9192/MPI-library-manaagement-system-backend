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
import { IPaginationOptions } from '../../types';
import { calculatePagination } from '../../helpers/paginationHelper';

const getAllStudentRegistrationRequestsFromDB = async (
  filterPayload: IStudentRegistrationRequestFilterPayload,
  paginationOptions: IPaginationOptions
) => {
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
    .sort({ [sortBy]: sortOrder, index: 1 }) // Sort by requested field and preserve original order
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
};

const RejectRequestIntoDB = async (payload: IRejectStudentRegistrationRequestPayload) => {
  const { requestId, reasonForReject } = payload;

  // Step 1: Find the registration request by ID
  const request = await StudentRegistrationRequest.findById(requestId);

  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
  }

  // Step 2: Check if request is already finalized (REJECTED, APPROVED, or EXPIRED)
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

  // Step 3: Update the request status to REJECTED with reason
  const updateResult = await StudentRegistrationRequest.updateOne(
    { _id: request._id },
    {
      status: REJECTED,
      reasonForReject,
      index: 0,
    }
  );

  if (!updateResult.modifiedCount) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to reject the request');
  }

  return null;
};

const ApproveRequestIntoDB = async (id: string) => {
  // Fetch the registration request by ID
  const request = await StudentRegistrationRequest.findById(id);

  // Throw error if request doesn't exist
  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, 'Registration request not found');
  }

  const { status } = request;

  // Throw error if request is already rejected
  if (status === EStudentRegistrationRequestStatus.REJECTED) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is already rejected');
  }

  // Throw error if request is already approved
  if (status === EStudentRegistrationRequestStatus.APPROVED) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is already approved');
  }

  // Throw error if request is expired
  if (status === EStudentRegistrationRequestStatus.EXPIRED) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This registration request is expired');
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
          role: request.roll,
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

    // Commit the transaction if everything succeeded
    await session.commitTransaction();
    // End the database session
    session.endSession();
    return null;
  } catch (error) {
    // Rollback transaction in case of error
    await session.abortTransaction();
    // End the database session
    session.endSession();
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Approval failed. Something went wrong.');
  }
};

const StudentRegistrationRequestServices = {
  RejectRequestIntoDB,
  ApproveRequestIntoDB,
  getAllStudentRegistrationRequestsFromDB,
};

export default StudentRegistrationRequest;
