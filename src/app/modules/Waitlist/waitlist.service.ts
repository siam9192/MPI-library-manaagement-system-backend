import AppError from '../../Errors/AppError';
import { isValidObjectId, objectId, throwInternalError } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import {ICreateWaitlistPayload } from './waitlist.interface';
import Waitlist from './waitlist.model';


class WaitlistService {
  async addToWaitlist(
    authUser: IAuthUser,
    payload: ICreateWaitlistPayload
  ) {
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
      throwInternalError()
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
    throwInternalError()
    }

    return null;
  }
}

export default new WaitlistService();
