import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { generateSlug, isValidObjectId, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import {
  EGenreStatus,
  ICreateGenrePayload,
  IGenresFilterPayload,
  IGenreUpdatePayload,
  IPublicGenresFilterPayload,
} from './genre.interface';
import Genre from './genre.model';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EGenreAction } from '../AuditLog/audit-log.interface';
import Book from '../Book/book.model';
import { EBookStatus } from '../Book/book.interface';

class GenreService {
  async createGenreIntoDB(authUser: IAuthUser, payload: ICreateGenrePayload) {
    // Generate initial slug from the genre name
    let slug = generateSlug(payload.name);

    // Check if the slug already exists in the database
    let counter = 2;
    while (await Genre.findOne({ slug })) {
      // If it exists, append a counter to make the slug unique
      slug = generateSlug(payload.name + ' ' + counter);
      counter++;
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Attempt to create the genre in the database
      const [createdGenre] = await Genre.create([{ ...payload, slug }], { session });

      // Throw an error if creation failed
      if (!createdGenre) {
        throw new Error('Genre could not be created');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.GENRE,
            action: EGenreAction.CREATE,
            description: `Created new genre: ${createdGenre.name} `,
            targetId: createdGenre._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();

      // Return the created genre (you were returning null earlier — assuming that was a mistake)
      return createdGenre;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Genre creation failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async updateGenreIntoDB(authUser: IAuthUser, id: string, payload: IGenreUpdatePayload) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }

    // Find the genre
    const genre = await Genre.findOne({ _id: objectId(id), status: EGenreStatus.DELETED });
    if (!genre) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    // Initialize slug with the current one
    let slug = genre.slug;

    // If the name is being changed, regenerate the slug
    if (payload.name && payload.name !== genre.name) {
      slug = generateSlug(payload.name);
      let count = 2;

      // Ensure the new slug is unique
      while (await Genre.findOne({ slug })) {
        slug = generateSlug(`${payload.name} ${count}`);
        count++;
      }
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Update the author with new data and slug
      const genreUpdateStatus = await Genre.updateOne(
        { _id: objectId(id) },
        {
          ...payload,
          slug,
        },
        { session }
      );

      if (!genreUpdateStatus.modifiedCount) {
        throw new Error('Genre could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.GENRE,
            action: EGenreAction.UPDATE,
            description: `Update genre`,
            targetId: genre._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return await Genre.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Genre update failed'
      );
    } finally {
      await session.endSession();
    }
  }
  async changeGenreStatusIntoDB(
    authUser: IAuthUser,
    id: string,
    payload: { status: EGenreStatus }
  ) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EGenreStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

    // Find the genre
    const genre = await Genre.findOne({ _id: objectId(id), status: EGenreStatus.DELETED });
    if (!genre) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    // Prevent status changes if the author is already deleted
    if (genre.status === EGenreStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Cannot change the status of a deleted genre.');
    }

    const session = await startSession();
    session.startTransaction();
    try {
      const genreUpdateStatus = Genre.updateOne(
        { _id: objectId },
        { status },
        { new: true } // return the updated document
      );

      if (!genreUpdateStatus) {
        throw new Error('Genre could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.GENRE,
            action: EGenreAction.CHANGE_STATUS,
            description: `Changed genre "${genre.name}"  status ${genre.status} to ${status}`,
            targetId: genre._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      await session.commitTransaction();

      return await Genre.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Genre status change failed'
      );
    }
  }

  async softDeleteGenreIntoDB(authUser: IAuthUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }

    // Find the genre
    const genre = await Genre.findOne({ _id: objectId(id), status: EGenreStatus.DELETED });
    if (!genre) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    const bookExist = await Book.find({
      genre: genre._id,
      status: {
        $ne: EBookStatus.DELETED,
      },
    }).countDocuments();

    // Check book existence
    if (bookExist) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `This genre cannot be deleted as it is associated with ${bookExist} books.`
      );
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Update the author with new data and slug
      const genreUpdateStatus = await Genre.updateOne(
        { _id: objectId(id) },
        {
          status: EGenreStatus.DELETED,
        },
        { session }
      );

      if (!genreUpdateStatus.modifiedCount) {
        throw new Error('Genre could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.DEPARTMENT,
            action: EGenreAction.DELETE,
            description: `Deleted genre "${genre.name}"`,
            targetId: genre._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return await Genre.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Genre update failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async getPublicGenreByIdFromDB(id: string) {
    const author = await Genre.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    if (author.status !== EGenreStatus.ACTIVE) {
      throw new AppError(httpStatus.NOT_FOUND, 'This genre is no longer available');
    }

    return author;
  }

  async getGenreByIdFromDB(id: string) {
    const author = await Genre.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status === EGenreStatus.DELETED) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getPublicGenresFromDB(
    filterPayload: IPublicGenresFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: EGenreStatus.ACTIVE,
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Genre.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Genre.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: authors,
      meta,
    };
  }

  async getGenresFromDB(
    filterPayload: IGenresFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EGenreStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Genre.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Genre.countDocuments(whereConditions);

    const total = await Genre.countDocuments({
      status: {
        $ne: EGenreStatus.DELETED,
      },
    });

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: authors,
      meta,
    };
  }
}

export default new GenreService();
