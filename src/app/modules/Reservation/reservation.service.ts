import { date, z } from 'zod';
import { IAuthUser, IPaginationOptions } from '../../types';
import {
  EReservationStatus,
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
import Notification from '../Notification/notification.model';
import { GLOBAL_ERROR_MESSAGE } from '../../utils/constant';
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

      const student = reservation.student as any as IStudent;
      const book = reservation.book as any as IBook;

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

        // Update book copy
        const bookCopyUpdateStatus = await BookCopy.updateOne(
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

        if (!bookCopyUpdateStatus.matchedCount) {
          throw new Error('Book copy update failed');
        }

        const bookUpdateStatus = await Book.updateOne(
          {
            _id: book._id,
          },
          {
            $inc: {
              'count.availableCopies': 1,
            },
          },
          { session }
        );

        if (!bookUpdateStatus.matchedCount) {
          throw new Error('Book  update failed');
        }

        const reputationLoos = systemSettings.reservationPolicy.reputationLoss.onCancel;
        const decrementedReputation = student.reputationIndex - reputationLoos;

        // Decrement student reputation index as a punishment
        if (reputationLoos) {
          const studentUpdateStatus = await Student.updateOne(
            {
              _id: student._id,
            },
            {
              reputationIndex: decrementedReputation < 0 ? 0 : decrementedReputation,
            },
            { session }
          );

          if (studentUpdateStatus.modifiedCount) {
            throw new Error('Student update failed');
          }
        }

        // Create borrow history
        const [createdHistory] = await BorrowHistory.create(
          [
            {
              title: `Canceled Reservation: ${book.name}`,
              description: `Your reservation for "${book.name}" has been canceled. Your reputation has decreased by ${reputationLoos}. Keep engaging positively to improve your score!`,
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
              message: `Your reservation for "${book.name}" has been canceled successfully!`,
              type: ENotificationType.INFO,
              metaData: {
                reservationId: reservation.id,
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
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, GLOBAL_ERROR_MESSAGE);
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
        `Sorry, you can’t check out this reservation it’s not currently in the 'awaiting' stage.`
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
            description: `Handed over by ${librarian?.fullName || ''} Return it before ${new Date(dueDate).toDateString()}`,
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
            description: `Checked out reserved book "${book.name}" to student ID ${authUser.profileId}`,
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
      const [createdNotification] = await Notification.create(
        [
          {
            user: student.user,
            message: `Your have successfully  picked up your reserved book "${book.name}"!.Kindly return it as well on time to avoid penalties`,
            type: ENotificationType.INFO,
            metaData: {
              reservationId: reservation.id,
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
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, GLOBAL_ERROR_MESSAGE);
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
}

export default new ReservationService();
