import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import {
  EBorrowRecordStatus,
  EBorrowReturnCondition,
  IProcessBorrowPayload,
} from './borrow.interface';
import Fine from '../Fine/fine.model';
import { EFineStatus } from '../Fine/fine.interface';
import { calculatePagination } from '../../helpers/paginationHelper';
import { Student } from '../Student/student.model';
import BorrowRecord from './borrow.model';
import httpStatus from '../../shared/http-status';
import BookCopy from '../BookCopy/book-copy.model';
import { EBookCopyStatus, IBookCopy } from '../BookCopy/book-copy.interface';
import systemSettingService from '../SystemSetting/system-setting.service';

class BorrowService {
  async returnBorrowIntoDB(id: string, payload: IProcessBorrowPayload) {
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
      const isOverdue = now > new Date(borrow.dueDate);
      const diffInMs = now.getTime() - new Date(borrow.dueDate).getTime();
      const overdueDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      const overdueFineAmount = systemSettings.lateFeePerDay * overdueDays;

      if(condition === EBorrowReturnCondition.NORMAL){
          const borrowUpdateData: Record<string, unknown> = {
            returnCondition: payload.bookConditionStatus,
            status: EBorrowRecordStatus.RETURNED,
            isOverdue,
          };
          if (isOverdue) {
            const fineData: Record<string, unknown> = {
              amount: overdueFineAmount + payload.fineAmount! ,
              student: borrow.student,
              borrow: borrow._id,
              issuedDate: new Date(),
              reason:   isOverdue ? 'overdue':''
            };

            if (payload.isFineReceived) {
              fineData.paidDate = new Date();
              fineData.status = EFineStatus.PAID;
            }
            const [createdFine] = await Fine.create([fineData], { session });
            if (!createdFine) throw new Error();
          }

          const updateBorrow = await BorrowRecord.updateOne({ _id: borrow._id }, borrowUpdateData, {
            session,
          });

          if (!updateBorrow.modifiedCount) {
            throw new Error();
          }

          // Determine book copy update status
          const copyUpdateData: any = {
            status:
              payload.makeAvailable === true
                ? EBookCopyStatus.AVAILABLE
                : EBookCopyStatus.UNAVAILABLE,
          };

          const updateCopy = await BookCopy.updateOne({ _id: borrow.copy }, copyUpdateData, {
            session,
          });
          if (!updateCopy.matchedCount) {
            throw new Error();
          }
      }

      else {
          const borrowUpdateData: Record<string, unknown> = {
            returnCondition: payload.bookConditionStatus,
            status: EBorrowRecordStatus.RETURNED,
            isOverdue,
          };
          if (isOverdue) {
            const fineData: Record<string, unknown> = {
              amount: overdueFineAmount,
              student: borrow.student,
              borrow: borrow._id,
              issuedDate: new Date(),
              reason: 'overdue',
            };

            if (payload.isFineReceived) {
              fineData.paidDate = new Date();
              fineData.status = EFineStatus.PAID;
            }
            const [createdFine] = await Fine.create([fineData], { session });
            if (!createdFine) throw new Error();
          }

          const updateBorrow = await BorrowRecord.updateOne({ _id: borrow._id }, borrowUpdateData, {
            session,
          });

          if (!updateBorrow.modifiedCount) {
            throw new Error();
          }

          // Determine book copy update status
          const copyUpdateData: any = {
            status:
              payload.makeAvailable === true
                ? EBookCopyStatus.AVAILABLE
                : EBookCopyStatus.UNAVAILABLE,
          };

          const updateCopy = await BookCopy.updateOne({ _id: borrow.copy }, copyUpdateData, {
            session,
          });
          if (!updateCopy.matchedCount) {
            throw new Error();
          }
      }


    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return null;
  }
}
{
  // Update borrow status
  const updateBorrow = await BorrowRecord.updateOne(
    { _id: borrow._id },
    {
      returnStatus: payload.bookConditionStatus,
      status: EBorrowRecordStatus.RETURNED,
    },
    { session }
  );

  if (!updateBorrow.modifiedCount) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update borrow status.');
  }

  // Validate return condition
  const validConditions = [
    EBorrowReturnCondition.NORMAL,
    EBorrowReturnCondition.DAMAGED,
    EBorrowReturnCondition.LOST,
  ];
  if (!validConditions.includes(payload.bookConditionStatus)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid return condition.');
  }

  // Determine book copy update status
  const copyUpdateData: any = {
    status:
      payload.makeAvailable === true ? EBookCopyStatus.AVAILABLE : EBookCopyStatus.UNAVAILABLE,
  };

  const now = new Date();
  const isOverdue = now > new Date(borrow.dueDate);

  let fineReason: string | undefined;

  if (isOverdue) {
    fineReason = 'overdue';

    if (payload.bookConditionStatus !== EBorrowReturnCondition.NORMAL) {
      fineReason += `+${payload.bookConditionStatus}`;
      copyUpdateData.condition = payload.bookConditionStatus;
    }
  } else if (payload.bookConditionStatus !== EBorrowReturnCondition.NORMAL) {
    fineReason = payload.bookConditionStatus;
    copyUpdateData.condition = payload.bookConditionStatus;
  }

  const updateCopy = await BookCopy.updateOne({ _id: borrow.copy }, copyUpdateData, {
    session,
  });

  if (!updateCopy.modifiedCount) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update book copy status.');
  }

  // Calculate fine
  let fineAmount = 0;

  if (isOverdue) {
    const diffInMs = now.getTime() - new Date(borrow.dueDate).getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    fineAmount += diffInDays * systemSettings.lateFeePerDay;
  }

  if (payload.bookConditionStatus !== EBorrowReturnCondition.NORMAL) {
    fineAmount += payload.fineAmount ?? 0;
  }

  // Create fine if applicable
  if (fineAmount > 0) {
    const [createdFine] = await Fine.create(
      [
        {
          amount: fineAmount,
          borrow: borrow._id,
          reason: fineReason,
          status: payload.isFineReceived ? EFineStatus.PAID : EFineStatus.UNPAID,
        },
      ],
      { session }
    );

    if (!createdFine) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create fine record.');
    }
  }

  await session.commitTransaction();
}
