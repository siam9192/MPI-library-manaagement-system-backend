import { date, z } from 'zod';
import { IAuthUser, IPaginationOptions } from '../../types';
import {
  EReservationStatus,
  ICreateReservationPayload,
  IMyReservationsFilterPayload,
  IReservationsFilterPayload,
} from './reservation.interface';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import Reservation from './reservation.model';
import { calculatePagination } from '../../helpers/paginationHelper';
import { objectId } from '../../helpers';
import { startSession } from 'mongoose';
import BookCopy from '../BookCopy/book-copy.model';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import { IBorrowRequest } from '../BorrowRequest/borrow-request.interface';
import notificationService from '../Notification/notification.service';
import { IStudent } from '../Student/student.interface';
import { ENotificationType } from '../Notification/notification.interface';
import { EBookStatus, IBook } from '../Book/book.interface';
import systemSettingService from '../SystemSetting/system-setting.service';
import { Student } from '../Student/student.model';
import QrCode from 'qrcode';
import { Response } from 'express';
import ejs from 'ejs';
import path from 'path';
import BorrowHistory from '../BorrowHistory/borrow-history.model';
import Librarian from '../Librarian/librarian.model';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EReservationAction } from '../AuditLog/audit-log.interface';
import Book from '../Book/book.model';

class ReservationService {
  async getReservationsFromDB(
    filterPayload: IReservationsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { roll, secret, status } = filterPayload;

    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(EReservationStatus).includes(status)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
      }
      whereConditions.status = status;
    }

    let reservations;
    let totalResult;

    if (roll) {
      if (!z.number().int().safeParse(Number(roll)).success) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid roll number');
      }
      reservations = await Reservation.aggregate([
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
          $match: {
            'student.roll': parseInt(roll),
            ...whereConditions,
          },
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
          $lookup: {
            from: 'bookcopies',
            localField: 'copy',
            foreignField: '_id',
            as: 'copy',
          },
        },
        {
          $unwind: '$copy',
        },

        {
          $sort: {
            index: -1,
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
          await Reservation.aggregate([
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
              $match: {
                'student.roll': parseInt(roll),
              },
            },
            {
              $count: 'total',
            },
          ])
        )[0]?.total || 0;
    }
    if (secret) {
      const reservation = await Reservation.findOne({
        secret,
      }).populate(['student', 'book', 'copy']);
      reservations = [reservation];
      totalResult = reservations.length;
    } else {
      reservations = await Reservation.find(whereConditions)
        .sort({
          index: -1,
          [sortBy]: sortOrder,
        })
        .populate(['student', 'book', 'copy']);
      totalResult = await Reservation.countDocuments();
    }
    const total = await Reservation.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: reservations,
      meta,
    };
  }
  async cancelReservation(authUser: IAuthUser, id: string) {
    {
      const reservation = await Reservation.findOne({
        _id: objectId(id),
        student: objectId(authUser.profileId),
      }).populate(['book', 'copy', 'student']);

      //Check if reservation exist
      if (!reservation) throw new AppError(httpStatus.NOT_FOUND, 'Reservation not found');

      // Check if reservation is already canceled
      if (reservation.status === EReservationStatus.CANCELED) {
        throw new AppError(httpStatus.FORBIDDEN, `Reservation is already canceled`);
      }
      // Check if reservation status is not awaiting
      if (reservation.status !== EReservationStatus.AWAITING) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          `Reservation can not be cancel it's not in awaiting`
        );
      }

      const systemSettings = await systemSettingService.getCurrentSettings();

      const session = await startSession();
      session.startTransaction();

      try {
        const reservationUpdate = await Reservation.updateOne(
          {
            _id: objectId(id),
          },
          {
            status: EReservationStatus.CANCELED,
          },
          {
            session,
          }
        );
        if (!reservationUpdate.modifiedCount) {
          throw new Error();
        }

        const updateBookCopy = await BookCopy.updateOne(
          {
            _id: reservation.copy,
          },
          {
            status: EBookCopyStatus.AVAILABLE,
          },
          {
            session,
          }
        );

        if (!updateBookCopy.matchedCount) {
          throw new Error();
        }

        const student = reservation.student as any as IStudent;
        const book = reservation.book as any as IBook;

        const decrementedReputation =
          student.reputationIndex - systemSettings.lostReputationOnCancelReservation;

        // Decrement student reputation index as a punishment
        if (systemSettings.lostReputationOnCancelReservation) {
          await Student.updateOne(
            {
              _id: student._id,
            },
            {
              reputationIndex: decrementedReputation < 0 ? 0 : decrementedReputation,
            },
            { session }
          );
        }

        // Create borrow history
        const [createdHistory] = await BorrowHistory.create(
          [
            {
              title: `Canceled Reservation: ${book.name}`,
              description: `You canceled your reservation for "${book.name}".Reputation: -${systemSettings.lostReputationOnCancelReservation}`,
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
        await notificationService.notify(
          student.user.toString(),
          {
            message: `You’ve successfully canceled your reservation for "${book.name}" but you had lost ${systemSettings.lostReputationOnCancelReservation} reputation point as a penalty.`,
            type: ENotificationType.SUCCESS,
          },
          session
        );

        await session.commitTransaction();
        return null;
      } catch (error) {
        await session.abortTransaction();
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error!.Reservation cancellation failed'
        );
      } finally {
        session.endSession();
      }
    }
  }

  async checkoutReservation(authUser: IAuthUser, id: string) {
    const reservation = await Reservation.findOne({
      _id: objectId(id),
    }).populate(['request', 'book', 'student']);

    //Check if reservation exist
    if (!reservation) throw new AppError(httpStatus.NOT_FOUND, 'Reservation not found');
    // Check if reservation status is not awaiting
    if (reservation.status !== EReservationStatus.AWAITING) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Reservation can not be checkout because it's not in awaiting`
      );
    }

    const session = await startSession();
    session.startTransaction();
    try {
      // set reservation status =  fulfilled
      const reservationUpdate = await Reservation.updateOne(
        {
          _id: objectId(id),
        },
        {
          status: EReservationStatus.FULFILLED,
          index: 0,
        },
        {
          session,
        }
      );
      if (!reservationUpdate.modifiedCount) {
        throw new Error();
      }

      // set book copy status =  checked_out
      const updateBookCopy = await BookCopy.updateOne(
        {
          _id: reservation.copy,
        },
        {
          status: EBookCopyStatus.CHECKED_OUT,
        },
        {
          session,
        }
      );

      if (!updateBookCopy.matchedCount) {
        throw new Error();
      }

      const dueDate = new Date(new Date().toDateString());

      dueDate.setDate(
        dueDate.getDate() + (reservation.request as any as IBorrowRequest).borrowForDays
      );

      const [createdBorrow] = await BorrowRecord.create(
        [
          {
            book: reservation.book,
            copy: reservation.copy,
            student: reservation.student,
            dueDate: dueDate,
          },
        ],
        { session }
      );

      if (!createdBorrow) throw new Error();
      const student = reservation.student as any as IStudent;
      const book = reservation.book as any as IBook;

      const librarian = await Librarian.findById(authUser.profileId).select('fullName');

      // Create borrow history
      const [createdHistory] = await BorrowHistory.create(
        [
          {
            title: `Book Picked Up: ${book.name}`,
            description: `Handed over by ${librarian?.fullName || ''}`,
            book: book._id,
            student: student._id,
          },
        ],
        { session }
      );
      if (!createdHistory) {
        throw new Error();
      }

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.RESERVATION,
            action: EReservationAction.PROCESS_CHECKOUT,
            description: `Handed over reserved book`,
            targetId: reservation._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      // Notify student
      await notificationService.notify(
        student.user.toString(),
        {
          message: `Your reservation for  "${book.name}" has been checked out successfully.`,
          type: ENotificationType.SUCCESS,
        },
        session
      );

      await session.commitTransaction();
      return null;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Reservation cancellation failed'
      );
    } finally {
      session.endSession();
    }
  }

  async getMyReservationsFromDB(
    authUser: IAuthUser,
    filterPayload: IMyReservationsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
    const { status } = filterPayload;

    // Initialize filter conditions
    const whereConditions: Record<string, any> = {
      student: objectId(authUser.profileId),
    };

    // If valid status is provided then apply it
    if (status) {
      if (!Object.values(EReservationStatus).includes(status)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
      }
      whereConditions.status = status;
    }

    const reservations = await Reservation.find(whereConditions)
      .sort({
        index: -1,
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .populate(['book', 'copy']);

    const totalResult = await Reservation.countDocuments(whereConditions);
    const total = await Reservation.countDocuments({ student: objectId(authUser.profileId) });
    const meta = {
      page,
      limit,
      totalResult,
      total,
    };
    return {
      data: reservations,
      meta,
    };
  }

  async getReservationById(id: string) {
    const reservation = await Reservation.findById(id).populate(['student', 'book', 'copy']);
    if (!reservation) throw new AppError(httpStatus.NOT_FOUND, 'Reservation not found');
    return reservation;
  }

  async getMyReservationById(authUser: IAuthUser, id: string) {
    const reservation = await Reservation.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    }).populate(['book', 'copy']);
    if (!reservation) throw new AppError(httpStatus.NOT_FOUND, 'Reservation not found');
    return reservation;
  }
  async getReservationQrCode(id: string, res: Response) {
    //  const reservation = await Reservation.findById(id);

    // //  Check reservation existence
    //  if(!reservation){
    //   throw new AppError(httpStatus.NOT_FOUND,"Reservation not found")
    //  }

    // Create QR code content
    const secret = `hello`;

    // Set response headers
    res.setHeader('Content-Type', 'image/png');

    // Generate QR code to response stream
    const qrUrl = await QrCode.toDataURL(secret, {
      width: 1400,
      type: 'image/webp',
    });

    const data = {
      roll: 9999,
      qrUrl,
      lastDate: new Date(),
    };

    await ejs.renderFile(
      path.join(process.cwd(), 'resource', 'ticket', 'index.ejs'),
      { data },
      async function (err, html) {}
    );
  }

  async createReservation(authUser: IAuthUser, payload: ICreateReservationPayload) {
    // Find the book and make sure it's active
    const book = await Book.findOne({
      _id: objectId(payload.bookId),
      status: EBookStatus.ACTIVE,
    });

    // Check is book exist
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, 'Book not found');
    }

    const bookCopies = await BookCopy.find({
      book: book._id,
      status: EBookCopyStatus.AVAILABLE,
    });

    if (!bookCopies.length) {
      throw new AppError(httpStatus.NOT_FOUND, 'Book is not available');
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
  }
}

export default new ReservationService();
