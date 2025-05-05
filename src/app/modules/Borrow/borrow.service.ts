import { startSession } from 'mongoose';
import envConfig from '../../config/env.config';
import AppError from '../../Errors/AppError';
import { objectId } from '../../helpers';
import jwtHelpers from '../../helpers/jwtHelpers';
import httpStatus from '../../shared/http-status';
import { EReservationStatus } from '../Reservation/reservation.interface';
import Reservation from '../Reservation/reservation.model';
import { IBorrowRequest } from '../BorrowRequest/borrow-request.interface';
import Borrow from './borrow.model';
import { IAuthUser, IPaginationOptions } from '../../types';
import Book from '../Book/book.model';
import {
  EBorrowStatus,
  EReturnStatus,
  IGetPendingReturnsFilterData,
  IReturnBorrowPayload,
} from './borrow.interface';
import Fine from '../Fine/fine.model';
import { EFineStatus } from '../Fine/fine.interface';
import { calculatePagination } from '../../helpers/paginationHelper';
import { Student } from '../Student/student.model';

const createBorrowIntoDB = async (authUser: IAuthUser, token: string) => {
  let decode;

  // Verify and decode the token
  try {
    decode = jwtHelpers.verifyToken(token, envConfig.jwt.borrowTicketTokenSecret as string);
    if (!decode) throw new Error();
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  // Find the reservation associated with the token
  const reservation = await Reservation.findOne({
    _id: objectId(decode.reservationId),
    status: EReservationStatus.AWAITING_PICKUP,
  }).populate({
    path: 'request',
  });

  if (!reservation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Reservation not found');
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const request = reservation.request as any as IBorrowRequest;

    // Calculate expected return date based on borrow days
    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + request.borrowForDays);

    // Create the borrow record
    const [createdBorrow] = await Borrow.create(
      [
        {
          book: request.book,
          student: request.student,
          expectedReturnDate,
          handedOveredBy: authUser.profileId,
          request: request._id,
        },
      ],
      { session }
    );

    if (!createdBorrow) {
      throw new Error('Failed to create borrow record');
    }

    // Update the reservation status
    const updateReservationStatus = await Reservation.updateOne(
      { _id: reservation._id },
      { status: EReservationStatus.AWAITING_PICKUP }
    );

    if (!updateReservationStatus.modifiedCount) {
      throw new Error('Failed to update reservation status');
    }

    // Find the next available borrow for the book
    const bookOngoingBorrows = await Borrow.find({
      status: EBorrowStatus.ONGOING,
    }).sort({ e: 1 });

    // Update book's expected available date
    const updateBookStatus = await Book.updateOne(
      { _id: request.book },
      { expectedAvailableDate: bookOngoingBorrows[0]?.expectedReturnDate || expectedReturnDate }
    );

    if (!updateBookStatus.modifiedCount) {
      throw new Error('Failed to update book status');
    }

    // Commit the transaction
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    await session.endSession();

    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Handed over failed');
  }
};

const returnBorrowIntoDB = async (id: string, payload: IReturnBorrowPayload) => {
  const borrow = await Borrow.findById(id);
  if (!borrow) {
    throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found.');
  }

  if (borrow.status === EBorrowStatus.RETURNED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Book has already been returned.');
  }

  const session = await startSession();
  session.startTransaction();

  try {
    // Update borrow status
    const updateBorrow = await Borrow.updateOne(
      { _id: borrow._id },
      {
        returnStatus: payload.bookStatus,
        status: EBorrowStatus.RETURNED,
      },
      { session }
    );

    if (!updateBorrow.modifiedCount) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update borrow status.');
    }

    // Check if fine needs to be created
    if ([EReturnStatus.DAMAGED, EReturnStatus.GOOD].includes(payload.bookStatus as any)) {
      const now = new Date();
      const isOverdue = now.getTime() > new Date(borrow.expectedReturnDate).getTime();

      const fineReason = isOverdue ? `Overdue+${payload.bookStatus}` : payload.bookStatus;

      const createdFine = await Fine.create(
        [
          {
            amount: payload.fineAmount,
            borrow: borrow._id,
            reason: fineReason,
            status: payload.isFineReceived ? EFineStatus.PAID : EFineStatus.PENDING,
          },
        ],
        { session }
      );

      if (!createdFine[0]) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create fine record.');
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  return null;
};

const getPendingReturnsFromDB = async (
  filterData: IGetPendingReturnsFilterData,
  paginationOptions: IPaginationOptions
) => {
  const { roll } = filterData;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Build dynamic query
  const whereConditions: any = {
    status: { $ne: EBorrowStatus.RETURNED },
  };

  if (roll && !isNaN(parseInt(roll))) {
    const student = await Student.findOne({ roll: parseInt(roll) });
    if (student) whereConditions.student = student._id;
  }

  const returns = await Borrow.find(whereConditions)
    .populate([
      {
        path: 'book',
      },
      {
        path: 'student',
        select: 'fullName profilePhoto roll',
      },
    ])
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  // Remove entries where student did not match (optional: depends on your logic)
  const filteredReturns = returns.filter((borrow) => borrow.student !== null);

  const totalResult = await Borrow.countDocuments(whereConditions);
  const total = await Borrow.countDocuments({ status: { $ne: EBorrowStatus.RETURNED } });

  const meta = {
    page,
    limit,
    totalResult,
    total,
  };

  return {
    meta,
    data: filteredReturns,
  };
};

const BorrowServices = {
  createBorrowIntoDB,
  returnBorrowIntoDB,
  getPendingReturnsFromDB,
};

export default BorrowServices;
