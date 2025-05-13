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
import { EBookCopyStatus} from '../BookCopy/book-copy.interface';
import systemSettingService from '../SystemSetting/system-setting.service';
import { IAuthUser, IPaginationOptions } from '../../types';
import { z } from 'zod';
import { isValidObjectId, objectId } from '../../helpers';

class BorrowRecordService {
  async processBorrowIntoDB(authUser: IAuthUser, id: string, payload: IProcessBorrowPayload) {
    // Id validation
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid borrowId');
    }
    const borrow = await BorrowRecord.findById(id);
    if (!borrow) {
      throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found.');
    }

    if (borrow.status === EBorrowRecordStatus.RETURNED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Book has already been returned.');
    }

    if (borrow.status === EBorrowRecordStatus.LOST) {
      throw new AppError(httpStatus.FORBIDDEN, 'Book has already been lost.');
    }

    const systemSettings = await systemSettingService.getCurrentSettings();
    const session = await startSession();
    session.startTransaction();

    try {
      const condition = payload.bookConditionStatus;
      const now = new Date();
      const dueDate = new Date(borrow.dueDate);
      const isOverdue = now > dueDate;
      const overdueDays = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const overdueFineAmount = isOverdue ? systemSettings.lateFeePerDay * overdueDays : 0;

      // Prepare borrow update data
      const borrowUpdateData: Record<string, unknown> = {
        returnCondition: condition,
        status:
          condition === EBorrowReturnCondition.LOST
            ? EBorrowRecordStatus.LOST
            : EBorrowRecordStatus.RETURNED,
        isOverdue,
      };

      // Handle fines if overdue
      if (isOverdue || condition !== EBorrowReturnCondition.NORMAL) {
        const fineData: Record<string, unknown> = {
          amount: overdueFineAmount + (payload.fineAmount || 0),
          student: borrow.student,
          borrow: borrow._id,
          issuedDate: now,
          reason:
            condition === EBorrowReturnCondition.NORMAL ? 'overdue' : `overdue + ${condition}`,
        };

        if (payload.isFineReceived) {
          fineData.paidDate = now;
          fineData.status = EFineStatus.PAID;
        }

        const [createdFine] = await Fine.create([fineData], { session });
        if (!createdFine) throw new Error('Failed to create fine record');
      }

      // Update borrow record
      const updateBorrow = await BorrowRecord.updateOne({ _id: borrow._id }, borrowUpdateData, {
        session,
      });

      if (!updateBorrow.modifiedCount) {
        throw new Error('Failed to update borrow record');
      }

      // Update book copy status
      const copyUpdateData: Record<string, unknown> = {
        status: payload.makeAvailable ? EBookCopyStatus.AVAILABLE : EBookCopyStatus.UNAVAILABLE,
      };

      const updateCopy = await BookCopy.updateOne({ _id: borrow.copy }, copyUpdateData, {
        session,
      });

      if (!updateCopy.matchedCount) {
        throw new Error('Failed to update book copy status');
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Process failed! Internal server error');
    } finally {
      await session.endSession();
    }

    return null;
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
    const borrowRecord = await BorrowRecord.findById(id).populate(['book', 'copy', 'student']);
    if (!borrowRecord) throw new AppError(httpStatus.NOT_FOUND, 'Borrow record not found');
    return borrowRecord;
  }

  async getMyNotReviewedFromDB(
    authUser: IAuthUser,
    paginationOptions: IPaginationOptions
  ) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: any = {
      student: objectId(authUser.profileId),
      review:null,
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
