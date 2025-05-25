import { ObjectId, startSession, Types } from 'mongoose';
import AppError from '../../Errors/AppError';
import { formatSecret, isValidObjectId, objectId, throwInternalError } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { ICreateWaitlistPayload } from './waitlist.interface';
import Waitlist from './waitlist.model';
import BookCopy from '../BookCopy/book-copy.model';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import User from '../User/user.model';
import { IStudent } from '../Student/student.interface';
import { EUserStatus } from '../User/user.interface';
import systemSettingService from '../SystemSetting/system-setting.service';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import { EBorrowRecordStatus } from '../BorrowRecord/borrow-record.interface';
import Reservation from '../Reservation/reservation.model';
import { EReservationStatus } from '../Reservation/reservation.interface';
import BorrowHistory from '../BorrowHistory/borrow-history.model';
import crypto from 'crypto';
import { IBook } from '../Book/book.interface';
import Notification from '../Notification/notification.model';
import { ENotificationAction, ENotificationType } from '../Notification/notification.interface';
class WaitlistService {
  async addToWaitlist(authUser: IAuthUser, payload: ICreateWaitlistPayload) {
    const exist = await Waitlist.findOne({
      student: objectId(authUser.profileId),
      book: objectId(payload.bookId),
    });
    // Check existence
    if (exist) {
      throw new AppError(httpStatus.FORBIDDEN, 'The book is already added on your waitlist');
    }

    const created = await Waitlist.create({
      student: authUser.profileId,
      book: payload.bookId,
      borrowForDays: payload.borrowForDays,
    });

    if (!created) {
      throwInternalError();
    }
    return created;
  }

  async getMyWaitlistItemsFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const requests = await Waitlist.find({
      student: objectId(authUser.profileId),
    })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate(['student', 'book']);

    const totalResult = await Waitlist.find({
      student: objectId(authUser.profileId),
    }).countDocuments();
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

  async removeFromWaitlist(authUser: IAuthUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }

    const request = await Waitlist.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    });

    if (!request) throw new AppError(httpStatus.NOT_FOUND, 'Item not found waitlist');
    const deleteStatus = await Waitlist.deleteOne({
      _id: objectId(id),
    });

    if (!deleteStatus.deletedCount) {
      throwInternalError();
    }

    return null;
  }

  async processWaitListOnBookAvailable(bookId: Types.ObjectId) {
    const bookCopy = await BookCopy.findOne({
      book: bookId,
      status: EBookCopyStatus.AVAILABLE,
    }).populate('book');

    // Check is book copy available
    if (!bookCopy) return;

    const book = bookCopy.book as any as IBook;

    const systemSetting = await systemSettingService.getCurrentSettings();

    const waitlist = await Waitlist.find({
      book: bookId,
    }).populate('student');

    for (const item of waitlist) {
      const student = item.student as any as IStudent;
      if (!student) continue;

      // Check account status first
      const user = await User.findOne({
        user: student.user,
        status: EUserStatus.ACTIVE,
      });

      if (!user) continue;

      if (student.reputationIndex < systemSetting.borrowingPolicy.minReputationRequired) {
        await Notification.create({
          user: student.user,
          message: `Your request for "${book.name}" from your waiting list couldn’t be approved  because your reputation point is less than ${student.reputationIndex}. Your request is removed for your waiting list.`,
          type: ENotificationType.INFO,
        });
        continue;
      }

      const totalOngoingBorrowExist = await BorrowRecord.find({
        student: student._id,
        status: {
          $in: [EBorrowRecordStatus.ONGOING, EBorrowRecordStatus.OVERDUE],
        },
      }).countDocuments();

      const totalReservationExist = await Reservation.find({
        student: student._id,
        book: bookId,
        status: EReservationStatus.AWAITING,
      }).countDocuments();

      const totalActiveBorrow = totalReservationExist + totalOngoingBorrowExist;

      // Check is student already have maximum active borrows
      if (systemSetting.borrowingPolicy.maxBorrowItems < totalActiveBorrow) {
        await Notification.create({
          user: student.user,
          message: `Your request for "${book.name}" from your waiting list couldn’t be processed right now because you’ve reached your maximum borrowing limit. Don’t worry — your request will be retried automatically when the book becomes available.`,
          type: ENotificationType.INFO,
        });
        continue;
      }

      const session = await startSession();
      session.startTransaction();

      try {
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
              student: student._id,
              book: bookId,
              copy: bookCopy._id,
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
          { _id: bookCopy._id },
          { status: EBookCopyStatus.RESERVED },
          { session }
        );
        if (!updateCopyStatus.modifiedCount) {
          throw new Error('Book copy update failed');
        }

        // Create borrow history
        const [createdHistory] = await BorrowHistory.create(
          [
            {
              title: `Reserved: ${book.name}`,
              description: `The book is reserved for you from your waiting borrow request. Kindly collect it before ${expireAt.toDateString()}  to avoid penalties`,
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
              message: `Great news! Your borrow request for "${book.name}" from your waiting list is now reserved. Kindly pick it up before it expires.`,
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
        break;
      } catch (error) {
        await session.abortTransaction();
        await Notification.create({
          user: student.user,
          message: `"Something went wrong while processing your request for "${book.name}" from your waiting list. No worries — we’ll try again automatically when the book becomes available`,
          type: ENotificationType.INFO,
        });
        continue;
      } finally {
        await session.endSession();
      }
    }
  }
}

export default new WaitlistService();
