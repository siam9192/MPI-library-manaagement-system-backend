import AppError from '../../Errors/AppError';
import { generateSecret } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import User from '../User/user.model';
import {
  EManagementAccountRegistrationRequestStatus,
  ICreateManagementAccountRequestPayload,
  IManagementRegistrationRequestFilterPayload,
} from './management-account-registration.interface';
import ManagementAccountRegistrationRequest from './management-account-registration.model';

const createRegistrationRequest = async (payload: ICreateManagementAccountRequestPayload) => {
  // Step 1: Check if the email is already used
  const existingUserByEmail = await User.findOne({ email: payload.email });
  if (existingUserByEmail) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'This email is already used, try another one');
  }

  //Step 2:  Generate a secret
  let secret = generateSecret();
  while (ManagementAccountRegistrationRequest.findOne({ secret })) {
    secret = generateSecret();
  }

  // Step 3:Insert data into db
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 7); //Set expire date 7 days

  const createdRequest = await ManagementAccountRegistrationRequest.create({
    email: payload.email,
    role: payload.role,
    expireAt,
  });
  if (!createdRequest) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong');
  }
};

const cancelRegistrationRequest = async (authUser: IAuthUser, id: string) => {
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
};

const rejectRegistrationRequest = async (authUser: IAuthUser, id: string) => {
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
};

const getAllStudentRegistrationRequestsFromDB = async (
  filterPayload: IManagementRegistrationRequestFilterPayload,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm } = filterPayload;

  // Calculate pagination parameters: page, skip, limit, sortBy, sortOrder
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Initialize filter with default condition
  const andConditions: Record<string, any> = {};

  // Apply searchTerm filtering on email
  if (searchTerm) {
    andConditions.email = { $regex: searchTerm, options: 'i' };
  }

  // Fetch filtered and paginated registration requests
  const requests = await ManagementAccountRegistrationRequest.find(andConditions)
    .sort({ [sortBy]: sortOrder, index: 1 }) // Sort by requested field and preserve original order
    .skip(skip)
    .limit(limit);

  // Count of filtered results (after applying filters)
  const totalResult = await ManagementAccountRegistrationRequest.countDocuments(andConditions);

  // Count of all registration requests (without any filters)
  const total = await ManagementAccountRegistrationRequest.countDocuments();

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

const ManagementAccountRegistrationRequestServices = {
  createRegistrationRequest,
  rejectRegistrationRequest,
  cancelRegistrationRequest,
  getAllStudentRegistrationRequestsFromDB,
};
