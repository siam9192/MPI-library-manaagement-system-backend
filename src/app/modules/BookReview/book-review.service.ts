import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import {
  EBookReviewStatus,
  IBookReviewsFilterPayload,
  ICreateBookReviewPayload,
} from './book-review.interface';
import BookReview from './book-review.model';
import { IAuthUser, IPaginationOptions } from '../../types';
import { IBook } from '../Book/book.interface';
import Book from '../Book/book.model';
import { calculatePagination } from '../../helpers/paginationHelper';

import { isValidObjectId, objectId } from '../../helpers';
import { z } from 'zod';

class BookReviewService {
  async createBookReview(authUser: IAuthUser, payload: ICreateBookReviewPayload) {
    const borrowRecord = await BorrowRecord.findById(payload.borrowId).populate('book');

    //  Check borrow record existence
    if (!borrowRecord) {
      throw new AppError(httpStatus.NOT_FOUND, 'Borrow  record not found');
    }

    //  Check if already reviewed
    if (borrowRecord.review) {
      throw new AppError(httpStatus.FORBIDDEN, 'Already reviewed!');
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const reviewData: Record<string, unknown> = {
        student: authUser.profileId,
        book: borrowRecord.book._id,
        borrow: borrowRecord._id,
        rating: payload.rating,
      };

      if (payload.content) reviewData.content = payload.content;

      const [createdReview] = await BookReview.create([reviewData], { session });

      if (!createdReview) {
        throw new Error();
      }
      const book = borrowRecord.book as any as IBook;

      const totalReviews = book.count.reviews;
      const totalRating = book.avgRating * totalReviews + payload.rating;
      const avgRating = totalRating / (totalReviews + 1);

      const updateBookStatus = await Book.updateOne(
        {
          _id: book._id,
        },
        {
          avgRating,
          $inc: {
            'count.reviews': 1,
          },
        },
        { session }
      );
      if (!updateBookStatus.modifiedCount) {
        throw new Error();
      }

      const updateBorrowStatus = await BorrowRecord.updateOne(
        {
          _id: borrowRecord._id,
        },
        {
          review: createdReview._id,
        },
        { session }
      );

      if (!updateBorrowStatus.modifiedCount) {
        throw new Error();
      }

      await session.commitTransaction();
      return createdReview;
    } catch {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Review could not be creation failed!. nternal server error!'
      );
    } finally {
      await session.endSession();
    }
  }

  async getBookReviewsFromDB(
    filterPayload: IBookReviewsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
    const { bookId, roll, minRating, maxRating, status } = filterPayload;

    const whereConditions: Record<string, any> = {};

    // Validate and apply roll
    if (roll) {
      if (!z.number().int().safeParse(Number(roll)).success) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid roll');
      }
      whereConditions['student.roll'] = parseInt(roll);
    }

    // Validate and apply bookId
    if (bookId) {
      if (!isValidObjectId(bookId)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid bookId');
      }
      whereConditions.book = objectId(bookId);
    }

    // Validate and apply status
    if (status) {
      if (!Object.values(EBookReviewStatus).includes(status)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
      }
      whereConditions.status = status;
    }

    // Validate and apply minRating and/or maxRating
    if (minRating || maxRating) {
      const avgRatingCondition: Record<string, any> = {};
      if (minRating) {
        const parsed = z.number().max(5).safeParse(Number(minRating));
        if (!parsed.success) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid minimum rating (must be a number ≤ 5)'
          );
        }
        avgRatingCondition.$gte = parsed.data;
      }
      if (maxRating) {
        const parsed = z.number().max(5).safeParse(Number(maxRating));
        if (!parsed.success) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid maximum rating (must be a number ≤ 5)'
          );
        }
        avgRatingCondition.$lte = parsed.data;
      }

      if (Object.keys(avgRatingCondition).length > 0) {
        whereConditions.avgRating = avgRatingCondition;
      }
    }

    let reviews;
    let totalResult;

    if (roll) {
      // Use aggregation when roll is involved
      const aggregationPipeline = [
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: '$student' },
        { $match: whereConditions },
        {
          $lookup: {
            from: 'books',
            localField: 'book',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        {
          $lookup: {
            from: 'borrowrecords',
            localField: 'borrow',
            foreignField: '_id',
            as: 'borrow',
          },
        },
        { $unwind: '$borrow' },
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limit },
      ];

      const countPipeline = [
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: '$student' },
        { $match: whereConditions },
        { $count: 'total' },
      ];

      const [reviewDocs, countDocs] = await Promise.all([
        BookReview.aggregate(aggregationPipeline),
        BookReview.aggregate(countPipeline),
      ]);

      reviews = reviewDocs;
      totalResult = countDocs[0]?.total || 0;
    } else {
      // Simple query with population
      const [reviewDocs, totalDocs] = await Promise.all([
        BookReview.find(whereConditions)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .populate(['student', 'book', 'borrowRecord'])
          .lean(),
        BookReview.countDocuments(whereConditions),
      ]);

      reviews = reviewDocs;
      totalResult = totalDocs;
    }

    return {
      data: reviews,
      meta: {
        page,
        limit,
        totalResult,
      },
    };
  }
  async getBookReviewById(id: string) {
    // Validate review ID
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid review ID');
    }

    const review = await BookReview.findOne({
      _id: objectId(id),
      status: {
        $ne: EBookReviewStatus.DELETED,
      },
    }).populate(['student', 'book', 'borrow']);
    if (!review) throw new AppError(httpStatus.NOT_FOUND, 'Book review not found');
    return review;
  }

  async getPublicBookReviewsByBookId(bookId: string, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    // Validate bookId
    if (!bookId || !isValidObjectId(bookId)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid bookId');
    }

    const whereConditions = {
      book: objectId(bookId),
      status: EBookReviewStatus.VISIBLE,
    };
    // Query reviews with population
    const reviews = await BookReview.find(whereConditions)
      .populate(['student', 'book'])
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalResult = await BookReview.find(whereConditions).countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: reviews,
      meta,
    };
  }
  async getPublicBookReviewById(id: string) {
    // Validate review ID
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid review ID');
    }

    const review = await BookReview.findOne({
      _id: objectId(id),
      status: EBookReviewStatus.VISIBLE,
    }).populate(['student', 'book']);
    if (!review) throw new AppError(httpStatus.NOT_FOUND, 'Book review not found');
    return review;
  }

  async changeBookReviewStatus(id: string, payload: { status: EBookReviewStatus }) {
    // Validate review ID
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid review ID');
    }
    // Update the review
    const updatedReview = await BookReview.findByIdAndUpdate(
      id,
      { status: payload.status },
      { new: true }
    )
      .populate(['student', 'book', 'borrowRecord'])
      .lean();

    // Handle not found
    if (!updatedReview) {
      throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
    }
    return updatedReview;
  }

  async softDeleteBookReviewIntoDB(authUser: IAuthUser, id: string) {
    // Validate review ID
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid review ID');
    }

    const review = await BookReview.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    });
    if (!review) throw new AppError(httpStatus.NOT_FOUND, 'Review not found');

    const updateStatus = await BookReview.updateOne(
      { _id: objectId(id) },
      { status: EBookReviewStatus.DELETED }
    );

    //  Check if deleted
    if (!updateStatus.modifiedCount) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Review deletion failed'
      );
    }
    return null;
  }
}

export default new BookReviewService();
