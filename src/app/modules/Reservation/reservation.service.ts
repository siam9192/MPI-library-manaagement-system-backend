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
import BorrowHistory from '../BorrowHistory/borrow-history.model';
import Librarian from '../Librarian/librarian.model';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EReservationAction } from '../AuditLog/audit-log.interface';
import Notification from '../Notification/notification.model';
import { GLOBAL_ERROR_MESSAGE } from '../../utils/constant';
import Book from '../Book/book.model';
import PdfDocument from 'pdfkit';
import axios from 'axios';
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
    const secret = `hello`; // You can use this to encode more secure data if needed

    try {
      // Generate QR code as data URL (PNG base64)

      // Start PDF generation
      const doc = new PdfDocument({ margin: 10 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=reservation_${id}.pdf`);

      doc.pipe(res);

      const interRegular = 'fonts/inter/Inter_18pt-Regular.ttf';
      const interMedium = 'fonts/inter/Inter_18pt-Medium.ttf';
      const poppinsRegular = 'fonts/poppins/Poppins-Regular.ttf';
      const poppinsMedium = 'fonts/poppins/Poppins-Medium.ttf';
      // Title

      let imageBuffer;
      let response;
      response = await axios.get(
        'https://t4.ftcdn.net/jpg/11/74/46/31/360_F_1174463150_ZIzTcZwFfcz7Xql3Vs6XMw5ZR4VE87Mc.jpg',
        { responseType: 'arraybuffer' }
      );

      imageBuffer = Buffer.from(response.data);

      doc.image(imageBuffer, { width: 50, height: 50 });
      doc.fontSize(25).font(poppinsMedium).text('MPI Library', 60, 20);

      doc.moveDown(0.4);

      const labelFont = interMedium;
      const valueFont = poppinsRegular;
      const labelX = 50;
      const valueX = 150;

      doc.fontSize(14).font(interMedium).text('Student Details:', labelX, doc.y);

      doc.moveDown(0.2);

      let y = doc.y; // Start Y position

      // Name
      doc
        .fontSize(12)
        .font(labelFont)
        .text('Name', labelX, y)
        .font(valueFont)
        .text(': Mr. X Doe', valueX, y);

      // Roll no
      doc
        .font(labelFont)
        .text('Roll no', labelX + valueX + 100, y)
        .font(valueFont)
        .text(': 123456', labelX + valueX * 2 + 10, y);
      y = doc.y + 5;

      // Department
      doc
        .font(labelFont)
        .text('Department', labelX, y)
        .font(valueFont)
        .text(': CST', valueX, y)

        .font(labelFont)
        .text('Session', labelX + valueX + 100, y)
        .font(valueFont)
        .text(': 2021-2022', labelX + valueX * 2 + 10, y);

      doc.moveDown(0.3);

      doc.fontSize(14).font(interMedium).text('Reservation Details:', labelX, doc.y);

      doc.moveDown(0.3);

      y = doc.y;

      // Name
      doc
        .fontSize(12)
        .font(labelFont)
        .text('Reserve ID', labelX, y)
        .font(valueFont)
        .text(': 84375864389578', valueX, y);

      // Roll no
      doc
        .font(labelFont)
        .text('Book ID', labelX + valueX + 100, y)
        .font(valueFont)
        .text(`: 76356743233`, labelX + valueX * 2 + 10, y);
      y = doc.y + 5;

      // Department
      doc
        .font(labelFont)
        .text('Issue date', labelX, y)
        .font(valueFont)
        .text(`: ${new Date().toLocaleDateString()}`, valueX, y)

        .font(labelFont)
        .text('Last date', labelX + valueX + 100, y)
        .font(valueFont)
        .text(`: ${new Date().toLocaleDateString()}`, labelX + valueX * 2 + 10, y);

      doc.moveDown(5);
      // Insert QR code image
      const qrCodeDataUrl = await QrCode.toDataURL(secret);
      const qrCodeSize = 150;
      imageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(imageBuffer, doc.page.width - qrCodeSize, 0, {
        width: qrCodeSize,
        height: qrCodeSize,
      });
      response = await axios.get(
        'https://blog-cdn.reedsy.com/directories/gallery/257/large_974bcaf2f9de1c92bf74a60f18e86d47.jpg',
        { responseType: 'arraybuffer' }
      );

      imageBuffer = Buffer.from(response.data, 'binary');
      doc.image(imageBuffer, 200, doc.y, { width: 200 });

      doc
        .fontSize(14)
        .font(interMedium)
        .fillColor('#CF0F47')
        .text(
          'Please collect it before 4th February 2025 to avoid penalties.\n Best wishes — hope it turns out sweet!',
          0,
          doc.page.height - 50,
          { continued: true, align: 'center' }
        );

      doc.end();
    } catch (error) {
      console.error('Error generating QR code PDF:', error);
      res.status(500).send('Failed to generate QR code PDF');
    }
  }
}

export default new ReservationService();
