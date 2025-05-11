import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import BorrowRecord from '../BorrowRecord/borrow-record.model';
import { EBookReviewStatus, IBookReviewsFilterPayload, ICreateBookReviewPayload } from './book-review.interface';
import BookReview from './book-review.model';
import { IAuthUser, IPaginationOptions } from '../../types';
import { IBook } from '../Book/book.interface';
import Book from '../Book/book.model';
import { calculatePagination } from '../../helpers/paginationHelper';
import { z } from 'zod';
import { isValidObjectId, objectId } from '../../helpers';

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

  async getBookReviewsFromDB (filterPayload:IBookReviewsFilterPayload,paginationOptions:IPaginationOptions){
   const {page,skip,limit,sortBy,sortOrder} = calculatePagination(paginationOptions)

   const {bookId,roll,minRating,maxRating,status} = filterPayload

   const whereConditions:Record<string,any> = {

   }
  
   // Check if valid roll then apply it
   if(roll){
      if(! z.number().int().safeParse(Number(roll)).success){
         throw new AppError(httpStatus.BAD_REQUEST,"Invalid roll")
      }
      whereConditions.roll = parseInt(roll)
   }

   if(bookId){
       if(!isValidObjectId(bookId)){
         throw new AppError(httpStatus.BAD_REQUEST,"Invalid roll")
      }
      whereConditions.book = objectId(bookId)
   }

   if(status){
         if(Object.values(EBookReviewStatus).includes(status)){
         throw new AppError(httpStatus.BAD_REQUEST,"Invalid roll")
      }
      whereConditions.status = status
   }
   
  //  If valid minRatting or maxRatting or both exist the apply 
 if (minRating || maxRating) {
  const avgRatingCondition: Record<string, any> = {};

  if (minRating) {
    const parsed = z.number().max(5).safeParse(Number(minRating));
    if (!parsed.success) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid minimum rating (must be a number ≤ 5)");
    }
    avgRatingCondition.$gte = parsed.data;
  }

  if (maxRating) {
    const parsed = z.number().max(5).safeParse(Number(maxRating));
    if (!parsed.success) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid maximum rating (must be a number ≤ 5)");
    }
    avgRatingCondition.$lte = parsed.data;
  }

  if (Object.keys(avgRatingCondition).length > 0) {
    whereConditions.avgRating = avgRatingCondition;
  }
}


let reviews;
let totalResult;

if(roll){
 reviews =  await BookReview.aggregate([
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
          $match: whereConditions
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
            from: 'borrowRecord',
            localField: 'book',
            foreignField: '_id',
            as: 'book',
          },
        },
        {
          $unwind: '$book',
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

      totalResult =
        (
          await BookReview.aggregate([
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
  }
  else {
    reviews = await BookReview.find(whereConditions)
        .sort({
          index: -1,
          [sortBy]: sortOrder,
        })
        .populate(['student', 'book','borrowRecord']);
      totalResult = await BookReview.countDocuments();
       const total = await BookReview.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: reviews,
      meta,
    };
  }
}

  }


