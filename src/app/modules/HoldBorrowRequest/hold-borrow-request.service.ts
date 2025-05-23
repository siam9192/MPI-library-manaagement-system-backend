import AppError from '../../Errors/AppError';
import { isValidObjectId, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { ICreateHoldBorrowRequestPayload } from './hold-borrow-request.interface';
import HoldBorrowRequest from './hold-borrow-request.model';

class HoldBorrowRequestService {
  async createHoldBorrowRequestIntoDB(
    authUser: IAuthUser,
    payload: ICreateHoldBorrowRequestPayload
  ) {
    const exist = await HoldBorrowRequest.findOne({
      student: objectId(authUser.profileId),
      book: objectId(payload.bookId),
    });
    // Check existence
    if (exist) {
      throw new AppError(httpStatus.FORBIDDEN, 'Already spotted');
    }

    const created = await HoldBorrowRequest.create({
      student: authUser.profileId,
      book: payload.bookId,
      borrowForDays: payload.borrowForDays,
    });

    if (!created) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Something went wrong on our end. Please try again later.'
      );
    }
    return created;
  }
  async getMyHoldBorrowRequestsFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const requests = await HoldBorrowRequest.find({
      student: objectId(authUser.profileId),
    })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate(['student', 'book']);

    const totalResult = await HoldBorrowRequest.find({
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
  async deleteBorrowRequestFromDB(authUser: IAuthUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid borrow request');
    }

    const request = await HoldBorrowRequest.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    });

    if (!request) throw new AppError(httpStatus.NOT_FOUND, ' Hold borrow request Not found');
    const deleteStatus = await HoldBorrowRequest.deleteOne({
      _id: objectId(id),
    });

    if (!deleteStatus.deletedCount) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!,Deletion failed'
      );
    }

    return null;
  }
}

export default new HoldBorrowRequestService();
