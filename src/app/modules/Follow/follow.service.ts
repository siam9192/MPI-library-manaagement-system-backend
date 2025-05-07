import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { isNumber, objectId } from '../../helpers';
import httpStatus from '../../shared/http-status';
import { EAuthorStatus } from '../../type';
import { IAuthUser, IPaginationOptions } from '../../types';
import Author from '../Author/author.model';
import {
  IAuthorFollowersFilterPayload,
  ICreateFollowPayload,
  IMineFollowsFilterPayload,
} from './Follow.interface';
import Follow from './Follow.model';
import { calculatePagination } from '../../helpers/paginationHelper';

class FollowService {
  async createFollowIntoDB(authUser: IAuthUser, payload: ICreateFollowPayload) {
    const { authorId } = payload;
    const author = await Author.findOne({
      _id: objectId(authorId),
      status: EAuthorStatus.ACTIVE,
    });

    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    const followExist = await Follow.findOne({
      student: objectId(authUser.profileId),
      author: objectId(authorId),
    });

    //   Check if student is already following this author
    if (followExist) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Already following');
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const createdFollow = await Follow.create(
        [
          {
            student: objectId(authUser.profileId),
            author: objectId(authorId),
          },
        ],
        { session }
      );

      await Author.updateOne(
        {
          _id: objectId(authorId),
        },
        {
          $inc: {
            'count.followers': 1,
          },
        }
      );

      await session.commitTransaction();
      await session.endSession();
      return createdFollow;
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Follow process failed!');
    }
  }

  async deleteFollowFromDB(authUser: IAuthUser, authorId: string) {
    const follow = await Follow.findOne({
      author: objectId(authorId),
      student: objectId(authUser.profileId),
    });
    if (!follow) {
      throw new AppError(httpStatus.NOT_FOUND, 'Follow not found');
    }

    const session = await startSession();
    session.startTransaction();

    try {
      await Follow.deleteOne(
        {
          _id: follow._id,
        },
        { session }
      );

      await Author.updateOne(
        {
          _id: objectId(authorId),
        },
        {
          $inc: {
            'count.followers': -1,
          },
        }
      );

      await session.commitTransaction();
      await session.endSession();
      return null;
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Follow delete operation failed');
    }
  }

  async getMineFollowsFromDB(
    authUser: IAuthUser,
    filterPayload: IMineFollowsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: Record<string, any> = {
      student: objectId(authUser.profileId),
    };

    const populateAuthorWhereConditions: Record<string, any> = {};

    // Apply searchTerm on author in name field if provided
    if (searchTerm) {
      populateAuthorWhereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    const follows = await Follow.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'author',
        match: populateAuthorWhereConditions,
      });

    const data = follows.filter((_) => _.author !== null);
    const totalResult = (
      await Follow.find(whereConditions)
        .sort({
          [sortBy]: sortOrder,
        })
        .populate({
          path: 'author',
          match: populateAuthorWhereConditions,
        })
    ).filter((_) => _.author !== null).length;

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data,
      meta,
    };
  }

  async getAuthorFollowersFromDB(
    authorId: string,
    filterPayload: IAuthorFollowersFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: Record<string, any> = {
      author: objectId(authorId),
    };

    const populateStudentWhereConditions: Record<string, any> = {};

    // If a searchTerm is provided, apply it to filter the student's data.
    // - If the searchTerm is a valid number, treat it as a roll number.
    // - Otherwise, perform a case-insensitive text search on the student's full name.
    if (searchTerm) {
      if (isNumber(searchTerm)) {
        populateStudentWhereConditions.roll = parseInt(searchTerm);
      } else {
        populateStudentWhereConditions.fullName = { $regex: searchTerm, $options: 'i' };
      }
    }

    const follows = await Follow.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'student',
        match: populateStudentWhereConditions,
      });

    const data = follows.filter((_) => _.student !== null);

    const totalResult = (
      await Follow.find(whereConditions)
        .sort({
          [sortBy]: sortOrder,
        })
        .populate({
          path: 'student',
          match: populateStudentWhereConditions,
        })
    ).filter((_) => _.student !== null).length;

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data,
      meta,
    };
  }

  async getFollowStatus(authUser: IAuthUser, authorId: string) {
    const isFollowExist = await Follow.findOne({
      student: objectId(authUser.profileId),
      author: objectId(authorId),
    });

    return {
      following: isFollowExist ? true : false,
    };
  }
}

export default new FollowService();
