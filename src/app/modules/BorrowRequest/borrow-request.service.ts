import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { generateSecret, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EBookStatus, IBooksFilterData } from '../Book/book.interface';
import Book from '../Book/book.model';
import Reservation from '../Reservation/reservation.model';

import {
  EBorrowRequestStatus,
  IApproveBorrowRequestPayload,
  ICreateBorrowRequestPayload,
  IManageBorrowRequestsFiltersData,
} from './borrow-request.interface';
import BorrowRequest from './borrow-request.model';
import { bcryptHash } from '../../helpers/bycryptHelpers';
import jwtHelpers from '../../helpers/jwtHelpers';
import envConfig from '../../config/env.config';

const createBorrowRequestIntoDB = async (
  authUser: IAuthUser,
  payload: ICreateBorrowRequestPayload
) => {
  // Find the book and make sure it's active
  const book = await Book.findOne({
    _id: objectId(payload.bookId),
    status: EBookStatus.ACTIVE,
  });

  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist");
  }

  // Set the expire date to 7 days from now
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 7);

  // Create the borrow request
  const createdRequest = await BorrowRequest.create({
    student: authUser.profileId,
    book: payload.bookId,
    borrowForDays: payload.borrowForDays,
    expireAt,
  });

  // Check if creation failed
  if (!createdRequest) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong while creating the borrow request'
    );
  }

  return createdRequest; // (optional) return created data if you need it
};

const getPendingBorrowRequestsForManageFromDB = async (
  filterData: IManageBorrowRequestsFiltersData,
  paginationOptions: IPaginationOptions
) => {
  const { roll } = filterData;

  const whereConditions: any = {
    status: EBorrowRequestStatus.PENDING,
  };
  if (roll && !isNaN(parseInt(roll))) {
    whereConditions.roll = parseInt(roll);
  }

  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const requests = await BorrowRequest.find(whereConditions)
    .skip(skip)
    .limit(limit)
    .sort({
      [sortBy]: sortOrder,
    })
    .populate(['student', 'book']);

  const totalResult = await BorrowRequest.countDocuments(whereConditions);

  const meta = {
    page,
    limit,
    totalResult,
  };

  return {
    data: requests,
    meta,
  };
};

const getMyBorrowRequestsFromDB = async (
  authUser: IAuthUser,
  paginationOptions: IPaginationOptions
) => {
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const whereConditions: any = {
    student: objectId(authUser.profileId),
  };
  const requests = await BorrowRequest.find(whereConditions)
    .skip(skip)
    .limit(limit)
    .sort({
      [sortBy]: sortOrder,
    })
    .populate(['student', 'book']);

  const totalResult = await BorrowRequest.countDocuments(whereConditions);

  const meta = {
    page,
    limit,
    totalResult,
  };

  return {
    data: requests,
    meta,
  };
};

const approveBorrowRequest = async (id: string, payload: IApproveBorrowRequestPayload) => {
  const request = await BorrowRequest.findById(id);
  if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Book not found');

  switch (request.status) {
    case EBorrowRequestStatus.APPROVED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already Approved');

    case EBorrowRequestStatus.REJECTED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already Rejected');
    case EBorrowRequestStatus.CANCELED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already canceled');

    case EBorrowRequestStatus.EXPIRED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is  Expired');
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const borrowRequestUpdate = await BorrowRequest.updateOne(
      {
        _id: objectId(id),
        status: EBorrowRequestStatus.APPROVED,
      },
      { session: session }
    );

    if (!borrowRequestUpdate.modifiedCount) {
      throw new Error();
    }

    const secret = generateSecret(100);
    const hashedSecret = await bcryptHash(secret);

    const reservation = await Reservation.create([
      {
        book: request.book,
        qty: 1,
        request: id,
        secret: hashedSecret,
        expiredAt: new Date(payload.expireDate),
      },
    ]);

    // Throw error if reservation not created
    if (!reservation[0]) {
      throw new Error();
    }

    const tokenPayload = {
      reservationId: reservation[0]._id.toString(),
      secret: secret,
    };

    const token = jwtHelpers.generateToken(
      payload,
      envConfig.jwt.borrowTicketTokenSecret as string,
      envConfig.jwt.borrowTicketTokenExpireTime as string
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Request approve failed');
  }

  return null;
};

const rejectBorrowRequest = async (id: string, payload: { rejectFor: string }) => {
  const request = await BorrowRequest.findById(id);
  if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Book not found');

  switch (request.status) {
    case EBorrowRequestStatus.APPROVED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already Approved');

    case EBorrowRequestStatus.REJECTED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already Rejected');
    case EBorrowRequestStatus.CANCELED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is already canceled');

    case EBorrowRequestStatus.EXPIRED:
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Request is  Expired');
  }

  const updateStatus = await BorrowRequest.updateOne(
    {
      _id: objectId(id),
    },
    {
      status: EBorrowRequestStatus.REJECTED,
      rejectedFor: payload.rejectFor,
    }
  );

  if (!updateStatus.modifiedCount) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Request  could not be  rejected.Something went wrong'
    );
  }
  return null;
};

const BorrowRequestServices = {
  createBorrowRequestIntoDB,
  getPendingBorrowRequestsForManageFromDB,
  getMyBorrowRequestsFromDB,
  approveBorrowRequest,
  rejectBorrowRequest,
};

export default BorrowRequestServices;
