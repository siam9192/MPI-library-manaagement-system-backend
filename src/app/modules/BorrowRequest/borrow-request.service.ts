import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { formatSecret, generateChar, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EBookStatus, IBook } from '../Book/book.interface';
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
import notificationService from '../Notification/notification.service';
import { ENotificationAction, ENotificationType } from '../Notification/notification.interface';
import { EReservationStatus } from '../Reservation/reservation.interface';
import { IStudent } from '../Student/student.interface';
import BorrowHistory from '../BorrowHistory/borrow-history.model';
import Notification from '../Notification/notification.model';
import { defaultErrorMessage } from '../../utils/constant';

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
    const student = await Student.findById(authUser.profileId);

    if (!student)
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!something went wrong'
      );

    const bookCopies = await BookCopy.find({
      book: book._id,
      status: EBookCopyStatus.AVAILABLE,
    });

    if (!bookCopies.length) {
      throw new AppError(httpStatus.NOT_FOUND, 'The Book is not available');
    }

    const systemSetting = await systemSettingService.getCurrentSettings();

    const totalOngoingBorrowExist = await BorrowRecord.find({
      student: objectId(authUser.profileId),
      status: {
        $in: [EBorrowRecordStatus.ONGOING, EBorrowRecordStatus.OVERDUE],
      },
    }).countDocuments();

    const totalReservationExist = await Reservation.find({
      student: objectId(authUser.profileId),
      book: objectId(payload.bookId),
      status: EReservationStatus.AWAITING,
    }).countDocuments();

    const totalActiveBorrow = totalReservationExist + totalOngoingBorrowExist;

    // Check is student already have maximum active borrows
    if (systemSetting.borrowingPolicy.maxBorrowItems < totalReservationExist) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Borrow request failed!.Requester Already have  ${totalActiveBorrow} active borrows `
      );
    }
    if (student.reputationIndex <= 0) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Request not possible because Reputation index is 0'
      );
    }
    const session = await startSession();
    session.startTransaction();

    let data;
    let message;

    try {
      if (student.reputationIndex < systemSetting.borrowingPolicy.minReputationRequired) {
        // Set the expire date
        const expireAt = new Date(new Date().toDateString());
        expireAt.setDate(
          expireAt.getDate() + systemSetting.reservationPolicy.borrowRequestExpiryDays
        );

        // Created reservation
        const [createdRequest] = await BorrowRequest.create(
          [
            {
              student: authUser.profileId,
              book: payload.bookId,
              borrowForDays: payload.borrowForDays,
              expireAt,
            },
          ],
          { session }
        );

        // Check if creation failed
        if (!createdRequest) {
          throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal server error');
        }

        message = `Your borrow request for "${book.name}" is currently pending due to a low reputation score. We're reviewing it and will get back to you shortly. Thank you for your patience!`;

        // Notify student
        const [createdNotification] = await Notification.create(
          [
            {
              user: student.user,
              message: `Your borrow request for "${book.name}" is currently pending due to a low reputation score. We're reviewing it and will get back to you shortly. Thank you for your patience!`,
              type: ENotificationType.INFO,
              action: ENotificationAction.DOWNLOAD_TICKET,
              metaData: {
                borrowRequestId: createdRequest.id,
              },
            },
          ],
          {
            session,
          }
        );

        if (!createdNotification) {
          throw new Error('notification creation failed');
        }
        data = createdRequest;
      } else {
        // Set the expire date
        const expireAt = new Date(new Date().toDateString());
        expireAt.setDate(
          expireAt.getDate() + systemSetting.reservationPolicy.reservationExpiryDays
        );
        let secret = formatSecret(crypto.randomBytes(20).toString('hex').slice(0, 20));
        while (await Reservation.findOne({ secret })) {
          secret = formatSecret(crypto.randomBytes(20).toString('hex').slice(0, 20));
        }
        const [createdReservation] = await Reservation.create(
          [
            {
              student: authUser.profileId,
              book: payload.bookId,
              copy: bookCopies[0]._id,
              expiryDate: expireAt,
              secret,
            },
          ],
          { session }
        );

        if (!createdReservation) {
          throw new Error('Reservation creation failed');
        }


           // Throw error if reservation not created
      if (!createdReservation) {
        throw new Error();
      }

      const updateCopyStatus = await BookCopy.updateOne(
        { _id:bookCopies[0]._id },
        { status: EBookCopyStatus.RESERVED },
        { session }
      );
     if (!updateCopyStatus.modifiedCount) {
        throw new Error("Book copy update failed");
      }

      
        // Create borrow history
        const [createdHistory] = await BorrowHistory.create(
          [
            {
              title: `Reserved: ${book.name}`,
              description: `The book is reserved for you on your borrow request. Kindly collect it before ${expireAt.toDateString()}  to avoid penalties`,
              book: book._id,
              student: student._id,
            },
          ],
          { session }
        );

        if (!createdHistory) {
          throw new Error();
        }
        // Notify student
        const [createdNotification] = await Notification.create(
          [
            {
              user: student.user,
              message: `Great news! Your borrow request for "${book.name}" is now reserved. Kindly pick it up before it expires.`,
              type: ENotificationType.INFO,
              action: ENotificationAction.DOWNLOAD_TICKET,
              metaData: {
                reservationId: createdReservation._id.toString(),
              },
            },
          ],
          {
            session,
          }
        );

        if (!createdNotification) {
          throw new Error('notification creation failed');
        }
        message = `Congratulations! The book has been reserved for you. Please collect it before ${expireAt.toDateString()} to avoid any penalties.`;
        data = createdReservation;
      }
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'There is something happened wrong.Please try again later'
      );
    } finally {
      await session.commitTransaction();
    }

    return {
      data,
      message,
    };
  }

  async approveBorrowRequest(
    authUser: IAuthUser,
    id: string
  ) {
    const request = await BorrowRequest.findById(id).populate('student', 'user', 'book');
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


    const book = request.book as any as IBook
    
    const bookCopies = await BookCopy.find({
      book: book._id,
      status: EBookCopyStatus.AVAILABLE,
    });

    if (!bookCopies.length) {
      throw new AppError(httpStatus.NOT_FOUND, 'The Book is not available');
    }

    const systemSettings = await systemSettingService.getCurrentSettings();
    const student = await Student.findById(request.student);

    if (!student) throw new Error();

    const session = await startSession();
    session.startTransaction();

    try {
      const borrowRequestUpdate = await BorrowRequest.updateOne(
        {
          _id: objectId(id),
        },
        {
          status: EBorrowRequestStatus.APPROVED,
          processedBy: {
            id: authUser.userId,
            at: new Date(),
          },
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

      // Set the expire date from now
      const expiryDate = new Date(new Date().toDateString());
      expiryDate.setDate(
        expiryDate.getDate() + systemSettings.reservationPolicy.reservationExpiryDays
      );

      const [createdReservation] = await Reservation.create(
        [
          {
            student: request.student,
            book: request.book,
            copy: bookCopies[0]._id,
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
        { _id:bookCopies[0]._id },
        { status: EBookCopyStatus.RESERVED },
        { session }
      );

      if (!updateCopy.modifiedCount) {
        throw new Error("Book copy update failed");
      }

      const book = request.book as any as IBook;

      // Create borrow history
      const [createdHistory] = await BorrowHistory.create(
        [
          {
            title: `Reserved: ${book.name}`,
            description: `The book is reserved for you on your borrow request. Kindly collect it before ${expiryDate.toDateString()}  to avoid penalties`,
            book: book._id,
            student: student._id,
          },
        ],
        { session }
      );

      if (!createdHistory) {
        throw new Error();
      }

      // Notify student
      const [createdNotification] = await Notification.create(
        [
          {
            user: student.user,
            message: `Great news! Your borrow request for "${book.name}" has been approved. The book is now reserved for you. Kindly pick it up before it expires.`,
            type: ENotificationType.INFO,
            action: ENotificationAction.DOWNLOAD_TICKET,
            metaData: {
              reservationId: createdReservation._id.toString(),
            },
          },
        ],
        {
          session,
        }
      );

      if (!createdNotification) {
        throw new Error('notification creation failed');
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Oops! There is something happened wrong.Please try again later'
      );
    }

    return null;
  }
  async rejectBorrowRequest(authUser: IAuthUser, id: string, payload: { rejectReason: string }) {
    const request = await BorrowRequest.findById(id).populate('student', 'user','book');
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


    const book = request.book as any as IBook

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
          processedBy: {
            id: authUser.userId,
            at: new Date(),
          },
          index: 0,
        },
        { session }
      );

      if (!updateStatus.modifiedCount) {
        throw new Error(
          'Borrow request update failed'
        );
      }
      const student = request.student as any as IStudent;

      // Notify student
      const [createdNotification] = await Notification.create(
        [
          {
            user: student.user,
            message: `Your borrow request for "${book.name}" has been rejected`,
            type: ENotificationType.INFO,
            action: ENotificationAction.DOWNLOAD_TICKET,
            metaData: {
             borrowRequestId:request._id
            },
          },
        ],
        {
          session,
        }
      );

      if (!createdNotification) {
        throw new Error('notification creation failed');
      }

      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Oops! There is something happened wrong.Please try again later'
      );
    }
  }

  async cancelBorrowRequest(authUser: IAuthUser, id: string) {
    const request = await BorrowRequest.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    }).populate('book');
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
        throw new Error(
          'Borrow request  update failed'
        );
      }

      const book = request.book as any as IBook;

      await notificationService.notify(
        authUser.userId,
        {
          message: `You've successfully canceled your  borrow request for  "${book.name}" has been successfully canceled`,
          type: ENotificationType.SUCCESS,
        },
        session
      );

      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        defaultErrorMessage
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
      status: EReservationStatus.AWAITING,
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
