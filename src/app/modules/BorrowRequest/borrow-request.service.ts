import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { formatSecret, generateChar, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EBookStatus } from '../Book/book.interface';
import Book from '../Book/book.model';
import Reservation from '../Reservation/reservation.model';

import {
  EBorrowRequestStatus,
  IApproveBorrowRequestPayload,
  IBorrowRequestsFilterPayload,
  ICreateBorrowRequestPayload,
} from './borrow-request.interface';
import crypto from 'crypto';
import systemSettingService from '../SystemSetting/system-setting.service';
import BorrowRequest from './borrow-request.model';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import { EBorrowRecordStatus } from '../BorrowRecord/borrow-record.interface';
import { Student } from '../Student/student.model';
import { z } from 'zod';
import BookCopy from '../BookCopy/book-copy.model';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import { EReservationStatus } from '../../type';
import { error } from 'console';

class BorrowRequestService {
  async createBorrowRequestIntoDB(authUser: IAuthUser, payload: ICreateBorrowRequestPayload) {
    // Find the book and make sure it's active
    const book = await Book.findOne({
      _id: objectId(payload.bookId),
      status: EBookStatus.ACTIVE,
    });

    // Check is book exist
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist");
    }
   
    const bookCopies = await BookCopy.find({
      book:book._id,
      status:EBookCopyStatus.AVAILABLE
    })

    if(!bookCopies.length){
       throw new AppError(httpStatus.NOT_FOUND, "The Book is not available");
    }
    
    const systemSettings = await systemSettingService.getCurrentSettings();

    const ongoingBorrowExist = await BorrowRecord.find({
      student: objectId(authUser.profileId),
      status: {
        $in: [EBorrowRecordStatus.ONGOING, EBorrowRecordStatus.OVERDUE],
      },
    });

    // Check is student already have maximum active borrows
    if (systemSettings.maxBorrowItems < ongoingBorrowExist.length) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Borrow request failed!.Requester Already have  ${ongoingBorrowExist} active borrows `
      );
    }

    const student = await Student.findById(authUser.profileId);

    if (!student)
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!something went wrong'
      );

    if (student.reputationIndex < 3) {
      throw new AppError(httpStatus.FORBIDDEN, 'Request Failed!.Reputation index  too low');
    }

    // Set the expire date to 7 days from now
    const expireAt = new Date(new Date().toDateString());
    expireAt.setDate(expireAt.getDate() + (systemSettings.borrowRequestExpiryDays || 7));

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
  }

  async approveBorrowRequest(
    authUser: IAuthUser,
    id: string,
    payload: IApproveBorrowRequestPayload
  ) {
    const request = await BorrowRequest.findById(id);
    if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Request not found');

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
    const copy = await BookCopy.findOne({
      _id: objectId(payload.copyId),
      book: request.book,
    });

    if (!copy) {
      throw new AppError(httpStatus.NOT_FOUND, 'Book copy  not found');
    }

    if (copy.status !== EBookCopyStatus.AVAILABLE) {
      throw new AppError(httpStatus.FORBIDDEN, 'The book copy is not available');
    }

    const systemSettings = await systemSettingService.getCurrentSettings();

    const ongoingBorrowExist = await BorrowRecord.find({
      student: objectId(authUser.profileId),
      status: {
        $in: [EBorrowRecordStatus.ONGOING, EBorrowRecordStatus.OVERDUE],
      },
    });

    // Check is student already have maximum active borrows
    if (systemSettings.maxBorrowItems < ongoingBorrowExist.length) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Approval failed!.Student Already have maximum   ${ongoingBorrowExist} active borrows `
      );
    }

    const student = await Student.findById(request.student);

    if (!student)
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!something went wrong'
      );

    if (student.reputationIndex < 3) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Approval failed!.Student reputation index  too low'
      );
    }

    const session = await startSession();
    session.startTransaction();
    try {
      const borrowRequestUpdate = await BorrowRequest.updateOne(
        {
          _id: objectId(id),
        },
        {
          status: EBorrowRequestStatus.APPROVED,
          processedBy: authUser.profileId,
          index: 0,
        },
        { session: session }
      );
      if (!borrowRequestUpdate.modifiedCount) {
        throw new Error();
      }

      //Generate unique secret
      let secret = formatSecret(crypto.randomBytes(20).toString('hex').slice(0, 20));
      while (await Reservation.findOne({ secret })) {
        secret = formatSecret(crypto.randomBytes(20).toString('hex').slice(0, 20));
      }

      // Set the expire date to 7 days from now
      const expiryDate = new Date(new Date().toDateString());
      expiryDate.setDate(expiryDate.getDate() + (systemSettings.reservationExpiryDays || 7));

      const [createdReservation] = await Reservation.create(
        [
          {
            student: request.student,
            book: request.book,
            copy: payload.copyId,
            request: id,
            expiryDate,
            secret,
          },
        ],
        { session }
      );

      // Throw error if reservation not created
      if (!createdReservation) {
        throw new Error();
      }

      const updateCopy = await BookCopy.updateOne(
        { _id: objectId(payload.copyId) },
        { status: EBookCopyStatus.RESERVED },
        { session }
      );

      if (!updateCopy.modifiedCount) {
        throw new Error();
      }

      await session.commitTransaction();
      await session.endSession();
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Request approval  failed'
      );
    }

    return null;
  }
  async rejectBorrowRequest(authUser: IAuthUser, id: string, payload: { rejectReason: string }) {
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
      const updateStatus = await BorrowRequest.updateOne(
        {
          _id: objectId(id),
        },
        {
          status: EBorrowRequestStatus.REJECTED,
          rejectReason: payload.rejectReason,
          processedBy: authUser.profileId,
          index: 0,
        },
        { session }
      );

      if (!updateStatus.modifiedCount) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Request  could not be  rejected.Something went wrong'
        );
      }
      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
    } finally {
      console.log(error);
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Request rejection  failed'
      );
    }
  }

  async cancelBorrowRequest(authUser: IAuthUser, id: string) {
    const request = await BorrowRequest.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    });
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
      const updateStatus = await BorrowRequest.updateOne(
        {
          _id: objectId(id),
        },
        {
          status: EBorrowRequestStatus.CANCELED,
          index: 0,
        },
        { session }
      );

      if (!updateStatus.modifiedCount) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Request  could not be  rejected.Something went wrong'
        );
      }
      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Request rejection  failed'
      );
    }
  }

  async getBorrowRequestsFromDB(
    filterPayload: IBorrowRequestsFilterPayload,
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

    if (status && Object.values(EBorrowRequestStatus).includes(status)) {
      whereConditions.status = status;
    }
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    // Init variables
    let requests;
    let totalResult;

    if (roll) {
      requests = await BorrowRequest.aggregate([
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

      totalResult =
        (
          await BorrowRequest.aggregate([
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
              $lookup: {
                from: 'books',
                localField: 'book',
                foreignField: '_id',
                as: 'book',
              },
            },
            {
              $unwind: '$book',
            },
            {
              $match: whereConditions,
            },
            {
              $count: 'total',
            },
          ])
        )[0]?.total || 0;
    } else {
      requests = await BorrowRequest.find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({
          [sortBy]: sortOrder,
        })
        .populate(['student', 'book']);
      totalResult = await BorrowRequest.countDocuments(whereConditions);
    }

    const total = await BorrowRequest.countDocuments();

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

  async getMyBorrowRequestsFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
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
  }

  async getBorrowRequestById(id: string) {
    const request = await BorrowRequest.findById(id).populate(['book', 'student']);
    if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Borrow request not found');
    const totalActiveBorrows = await BorrowRecord.countDocuments({
      student: request.student._id,
      status: {
        $in: [EBorrowRecordStatus.ONGOING, EBorrowRecordStatus.OVERDUE],
      },
    });
    const totalReserved = await Reservation.countDocuments({
      student: request.student._id,
      status: EReservationStatus.PENDING,
    });

    const studentMetaData = {
      totalActiveBorrows,
      totalReserved,
    };

    return {
      ...(request as any)._doc,
      studentMetaData,
    };
  }
  async getMyBorrowRequestById(authUser: IAuthUser, id: string) {
    const request = await BorrowRequest.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    }).populate(['book']);
    if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Borrow request not found');
    return request;
  }
}

export default new BorrowRequestService();
