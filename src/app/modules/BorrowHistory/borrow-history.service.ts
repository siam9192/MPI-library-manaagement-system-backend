import AppError from '../../Errors/AppError';
import { isValidObjectId, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import BorrowHistory from './borrow-history.model';

class BorrowHistoryService {
  async getMyBorrowHistoriesFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
    const histories = await BorrowHistory.find({
      student: objectId(authUser.profileId),
    })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('book');

    const data = histories;
    const totalResults = await BorrowHistory.countDocuments({
      student: objectId(authUser.profileId),
    });
    const meta = {
      page,
      skip,
      limit,
      totalResults,
    };

    return {
      data,
      meta,
    };
  }

  async getMyBorrowHistoryByIdFromDB(authUser: IAuthUser, id: string) {
    if (!isValidObjectId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }
    const history = await BorrowHistory.findById(id).populate('book');
    if (!history) throw new AppError(httpStatus.NOT_FOUND, 'History not found');
    return history;
  }
}

export default new BorrowHistoryService();
