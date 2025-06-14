import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import {
  EBorrowRecordStatus,
  EBorrowReturnCondition,
  IBorrowRecordsFilterPayload,
  IProcessBorrowPayload,
} from './borrow-record.interface';
import Fine from '../Fine/fine.model';
import { EFineStatus } from '../Fine/fine.interface';
import { calculatePagination } from '../../helpers/paginationHelper';
import BorrowRecord from './borrow-record.model';
import httpStatus from '../../shared/http-status';
import BookCopy from '../BookCopy/book-copy.model';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import { IAuthUser, IPaginationOptions } from '../../types';
import { z } from 'zod';
import { isValidObjectId, objectId, throwInternalError, validateObjectId } from '../../helpers';
import { IStudent } from '../Student/student.interface';
import { ENotificationCategory, ENotificationType } from '../Notification/notification.interface';
import { IBook } from '../Book/book.interface';
import Book from '../Book/book.model';
import BorrowHistory from '../BorrowHistory/borrow-history.model';
import Notification from '../Notification/notification.model';
import systemSettingService from '../SystemSetting/system-setting.service';
import { Student } from '../Student/student.model';
import waitlistService from '../Waitlist/waitlist.service';

class BorrowRecordService {

  async processBorrowIntoDB(authUser: IAuthUser, id: string, payload: IProcessBorrowPayload) {
    // Validate id
    validateObjectId(id);

    const borrow = await BorrowRecord.findById(id).populate(['student', 'book']);
    if (!borrow) {
      throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found.');
    }

    if (borrow.status === EBorrowRecordStatus.RETURNED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Book has already been returned.');
    }

    if (borrow.status === EBorrowRecordStatus.LOST) {
      throw new AppError(httpStatus.FORBIDDEN, 'Book has already been lost.');
    }

    const student = borrow.student as any as IStudent;
    const book = borrow.book as any as IBook;

    const systemSetting = await systemSettingService.getCurrentSettings();
    const session = await startSession();
    session.startTransaction();

    const historyBasicData: Record<string, any> = {
      title: '',
      description: 'any',
    };

    const notificationBasicData: Record<string, any> = {
      message: '',
      type: ENotificationType.INFO,
    };

    try {
      const condition = payload.bookCondition;
      const borrowingPolicy = systemSetting.borrowingPolicy;
      const finePolicy = systemSetting.finePolicy;
      const now = new Date();
      const dueDate = new Date(borrow.dueDate);
      const isOverdue = now > dueDate;
      const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const isLost = condition === EBorrowReturnCondition.LOST;
      const isFineReceived = payload.isFineReceived;
      let totalFineAmount;
      let fineReason;
      let reputationLost = 0;
      let reputationGain = 0;
      let reputationDelta = 0;
      // Overdue
      if (isOverdue) {
        if (isFineReceived) reputationGain = finePolicy.reputationGainOnFinePayment;

        if (isLost) {
          totalFineAmount = payload.fineAmount! + overdueDays * borrowingPolicy.lateFeePerDay;
          fineReason = 'overdue+lost';
          reputationLost = borrowingPolicy.reputationLoss.onLate_Lost;
          reputationDelta = reputationGain - reputationLost;

          notificationBasicData.message = `The book "${book.name}" has been marked as lost with overdue. A fine of $${totalFineAmount} has been ${isFineReceived ? 'paid successfully' : 'applied to your account.'}`;
          notificationBasicData.type = isFineReceived
            ? ENotificationType.INFO
            : ENotificationType.WARNING;
          historyBasicData.title = `Book Lost: "${book.name}"`;
          historyBasicData.description = `Lost book and it's ${overdueDays} days overdue also.Fine: ${totalFineAmount}.Reputation: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`;
        } else if (condition === EBorrowReturnCondition.DAMAGED) {
          totalFineAmount = payload.fineAmount!;
          fineReason = 'overdue+damaged';
          reputationLost = borrowingPolicy.reputationLoss.onLate_Damage;
          reputationDelta = reputationGain - reputationLost;
          notificationBasicData.type = isFineReceived
            ? ENotificationType.INFO
            : ENotificationType.WARNING;
          notificationBasicData.message = `The book "${book.name}" has been returned successfully but with ${overdueDays} days overdue and in damaged condition. A fine of $${totalFineAmount} has been ${isFineReceived ? 'paid successfully' : 'applied to your account.'}`;
          historyBasicData.title = `Book Return: "${book.name}"`;
          historyBasicData.description = `Returned in damaged condition and ${overdueDays} days overdue also.Fine: ${totalFineAmount}.Reputation: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`;
        } else {
          totalFineAmount = overdueDays * borrowingPolicy.lateFeePerDay;
          reputationLost = borrowingPolicy.reputationLoss.onLate;
          reputationDelta = reputationGain - reputationLost;
          fineReason = 'overdue';
          notificationBasicData.type = isFineReceived
            ? ENotificationType.INFO
            : ENotificationType.WARNING;
          notificationBasicData.message = `The book "${book.name}" has been returned successfully but with ${overdueDays} days overdue. A fine of $${totalFineAmount} has been ${isFineReceived ? 'paid successfully' : 'applied to your account.'}`;
          historyBasicData.title = `Book Return: "${book.name}"`;
          historyBasicData.description = `Returned with ${overdueDays} days overdue.Fine: ${totalFineAmount}.Reputation: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`;
        }
      } else {
        totalFineAmount = payload.fineAmount!;
        if (isLost) {
          fineReason = 'lost';
          reputationLost = borrowingPolicy.reputationLoss.onLost;
          reputationDelta = reputationGain - reputationLost;

          notificationBasicData.type = isFineReceived
            ? ENotificationType.INFO
            : ENotificationType.WARNING;
          notificationBasicData.message = `The book "${book.name}" has been reported as lost.  A fine of $${totalFineAmount} has been ${isFineReceived ? 'paid successfully' : 'applied to your account.'}`;
          historyBasicData.title = `Book Lost: "${book.name}"`;
          historyBasicData.description = `Reported as lost.Fine: ${totalFineAmount}.Reputation: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`;
        } else if (condition === EBorrowReturnCondition.DAMAGED) {
          fineReason = 'damaged';
          reputationLost = borrowingPolicy.reputationLoss.onDamage;
          reputationDelta = reputationGain - reputationLost;

          notificationBasicData.type = isFineReceived
            ? ENotificationType.INFO
            : ENotificationType.WARNING;
          notificationBasicData.message = `The book "${book.name}" has been returned successfully but  in damaged condition. A fine of $${totalFineAmount} has been ${isFineReceived ? 'paid successfully' : 'applied to your account.'}`;
          historyBasicData.title = `Book Return: "${book.name}"`;
          historyBasicData.description = `Returned in damaged condition.Fine: ${totalFineAmount}.Reputation: ${reputationDelta > 0 ? '+' : ''}${reputationDelta}`;
        } else {
          notificationBasicData.type = ENotificationType.SUCCESS;
          reputationGain = borrowingPolicy.reputationGain.returnOnTime_NormalCondition;
          reputationDelta = reputationGain - reputationLost;
          notificationBasicData.message = `The book "${book.name}" has been returned successfully on time`;
          historyBasicData.title = `Book Return: "${book.name}"`;
          historyBasicData.description = `Returned on time in normal condition.Reputation: + ${reputationGain}`;
        }
      }

      const borrowUpdateData: Record<string, unknown> = {
        status: isLost ? EBorrowRecordStatus.LOST : EBorrowRecordStatus.RETURNED,
        processedBy: {
          id: authUser.profileId,
          at: new Date(),
        },
        returnCondition: condition,
        returnDate: new Date(),
        isOverdue: isOverdue,
        overdueDays,
      };

      // Create fine on existence of fineAmount
      if (totalFineAmount) {
        const fineData: Record<string, unknown> = {
          amount: totalFineAmount,
          student: student._id,
          borrow: borrow._id,
          issuedDate: new Date(),
          reason: fineReason,
        };

        if (payload.isFineReceived) {
          fineData.paidDate = new Date();
          fineData.status = EFineStatus.PAID;
        }

        const [createdFine] = await Fine.create([fineData], { session });
        if (!createdFine) throw new Error('Failed to create fine record');

        borrowUpdateData.fine = createdFine._id;
      }

      // Update borrow record
      const updateBorrow = await BorrowRecord.updateOne({ _id: borrow._id }, borrowUpdateData, {
        session,
      });

      if (!updateBorrow.modifiedCount) {
        throw new Error('Failed to update borrow record');
      }

      const copyNewStatus = isLost
        ? EBookCopyStatus.LOST
        : payload.makeAvailable
          ? EBookCopyStatus.AVAILABLE
          : EBookCopyStatus.UNAVAILABLE;
      // Update book copy status
      const copyUpdateData: Record<string, unknown> = {
        status: copyNewStatus,
        condition,
      };

      // Update book

      const updateCopy = await BookCopy.updateOne({ _id: borrow.copy }, copyUpdateData, {
        session,
      });

      if (!updateCopy.matchedCount) {
        throw new Error('Failed to update book copy status');
      }

      const totalCopiesDelta = isLost ? -1 : 0;
      const availableCopiesDelta = [EBookCopyStatus.LOST, EBookCopyStatus.UNAVAILABLE].includes(
        copyNewStatus
      )
        ? -1
        : 1;

      const bookUpdateStatus = await Book.updateOne(
        { _id: book._id },
        {
          $inc: {
            'count.totalCopies': totalCopiesDelta,
            'count.availableCopies': availableCopiesDelta,
          },
        },
        {
          session,
        }
      );

      if (!bookUpdateStatus.modifiedCount) {
        throw new Error('book update failed');
      }

      const studentUpdateStatus = await Student.updateOne(
        {
          _id: student._id,
        },
        {
          $inc: {
            reputationIndex: reputationDelta,
          },
        },
        { session }
      );

      if (!studentUpdateStatus.modifiedCount) {
        throw new Error('Student update failed');
      }

      const createdHistory = await BorrowHistory.create(
        [
          {
            ...historyBasicData,
            borrow: borrow._id,
            student: student._id,
          },
        ],
        { session }
      );

      if (!createdHistory) {
        throw new Error('Borrow history creation failed');
      }

      const [createdNotification] = await Notification.create(
        [
          {
            category: ENotificationCategory.BORROW,
            ...notificationBasicData,
            user: student.user,
          },
        ],
        { session }
      );

      if (!createdNotification) {
        throw new Error('Notification creation failed');
      }

      await session.commitTransaction();
      waitlistService.processWaitListOnBookAvailable(book._id);
    } catch (error) {
      await session.abortTransaction();
      throwInternalError();
    } finally {
      await session.endSession();
    }

    return null;
  }
   
  async renewBorrowIntoDB (id:string){
        
  }

  async getBorrowRecordsFromDB(
    filterPayload: IBorrowRecordsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const { roll, status } = filterPayload;
    const whereConditions: any = {};

    // Check roll validation
    if (roll) {
      if (!z.number().int().safeParse(Number(roll)).success) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid roll number');
      }
      whereConditions['student.roll'] = Number(roll);
    }

    //  Check status validation
    if (status) {
      if (!Object.values(EBorrowRecordStatus).includes(status)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
      }
      whereConditions.status = status;
    }

    // Init variables
    let borrowRecords;
    let totalResult;

    if (roll) {
      borrowRecords = await BorrowRecord.aggregate([
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
          await BorrowRecord.aggregate([
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
              $count: 'total',
            },
          ])
        )[0]?.total || 0;
    } else {
      borrowRecords = await BorrowRecord.find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({
          [sortBy]: sortOrder,
        })
        .populate(['student', 'book', 'copy']);
      totalResult = await BorrowRecord.countDocuments(whereConditions);
    }

    const total = await BorrowRecord.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: borrowRecords,
      meta,
    };
  }
  async getBorrowRecordById(id: string) {
    // Validate id
    validateObjectId(id);

    const borrowRecord = await BorrowRecord.findById(id).populate(['book', 'copy', 'student']);
    if (!borrowRecord) throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found');
    return borrowRecord;
  }

  async getMyNotReviewedFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: any = {
      student: objectId(authUser.profileId),
      review: null,
    };
    const borrowRecords = await BorrowRecord.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortOrder,
      })
      .populate(['book', 'copy']);

    const totalResult = await BorrowRecord.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: borrowRecords,
      meta,
    };
  }

  async getMyNotReviewedBorrowRecordsFromDB(
    authUser: IAuthUser,
    paginationOptions: IPaginationOptions
  ) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: any = {
      student: objectId(authUser.profileId),
      review: {
        $eq: null,
      },
    };
    const borrowRecords = await BorrowRecord.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortOrder,
      })
      .populate(['book', 'copy']);

    const totalResult = await BorrowRecord.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: borrowRecords,
      meta,
    };
  }

  async getMyBorrowRecordsFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: any = {
      student: objectId(authUser.profileId),
    };
    const borrowRecords = await BorrowRecord.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortOrder,
      })
      .populate(['student', 'book']);

    const totalResult = await BorrowRecord.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: borrowRecords,
      meta,
    };
  }

  async getMyBorrowRecordById(authUser: IAuthUser, id: string) {
    const borrowRecord = await BorrowRecord.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    }).populate(['book', 'copy']);
    if (!borrowRecord) throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found');
    return borrowRecord;
  }
  

}

export default new BorrowRecordService();
