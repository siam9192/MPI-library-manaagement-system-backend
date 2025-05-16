import AppError from '../../Errors/AppError';
import { objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EBookStatus } from '../Book/book.interface';
import Book from '../Book/book.model';
import { ICreateWishlistBookPayload } from './wishlist.interface';
import WishlistBook from './wishlist.model';

import Wishlist from './wishlist.model';

class WishlistService {
  async createWishlistBookIntoDB(authUser: IAuthUser, payload: ICreateWishlistBookPayload) {
    const book = await Book.findOne({ _id: objectId(payload.bookId) });
    // Check book existence
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, 'Book not found');
    }

    const isExist = await Wishlist.findOne({
      student: objectId(authUser.profileId),
      book: book._id,
    });

    if (isExist) {
      throw new AppError(httpStatus.FORBIDDEN, 'Book is already exist on wishlist');
    }

    Book.updateOne(
      {
        _id: book._id,
      },
      {
        $inc: {
          'count.wishlistedCount': 1,
        },
      }
    );
    return await Wishlist.create({
      student: book._id,
      book: book._id,
    });
  }

  async deleteMyWishlistBookFromDB(author: IAuthUser, id: string) {
    const isExist = await Wishlist.findOne({
      _id: objectId(id),
      student: objectId(author.profileId),
    });

    // Check if the book exist  in wishlist
    if (!isExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Book not found in wishlist');
    }
    Book.updateOne(
      {
        _id: isExist.book,
      },
      {
        $inc: {
          'count.wishlistedCount': -1,
        },
      }
    );
    await WishlistBook.deleteOne({ _id: objectId(id) });
    return null;
  }

  async getMyWishlistBooksFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);
    const filterPipeline = Wishlist.aggregate([
      {
        $match: {
          student: objectId(authUser.profileId),
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
        $match: {
          'book.status': EBookStatus.ACTIVE,
        },
      },
      {
        $sort: {
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

    const totalResultCountPipeline = Wishlist.aggregate([
      {
        $match: {
          student: objectId(authUser.profileId),
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
        $match: {
          'book.status': EBookStatus.ACTIVE,
        },
      },
      {
        $count: 'total',
      },
    ]);

    let wishlistBooks;
    let totalResult;

    [wishlistBooks, totalResult] = await Promise.all([filterPipeline, totalResultCountPipeline]);

    totalResult = totalResult[0].total;

    const meta = {
      page,
      limit,
      totalResult,
    };
    return {
      data: wishlistBooks,
      meta,
    };
  }
}

export default new WishlistService();
