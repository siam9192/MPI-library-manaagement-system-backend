import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { generateSlug, objectId, validateObjectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import {
  EAuthorStatus,
  ICreateAuthorPayload,
  IGetPublicAuthorsFilterPayload,
  IUpdateAuthorPayload,
} from './author.interface';
import Author from './author.model';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EAuthorAction } from '../AuditLog/audit-log.interface';
import Book from '../Book/book.model';
import { EBookStatus } from '../Book/book.interface';

class AuthorService {
  async createAuthorIntoDB(authUser: IAuthUser, payload: ICreateAuthorPayload) {
    let slug = generateSlug(payload.name);
    let count = 2;
    while (await Author.findOne({ slug })) {
      slug = generateSlug(`${payload.name} ${count}`);
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const [createdAuthor] = await Author.create([{ ...payload, slug }], { session });

      if (!createdAuthor) {
        throw new Error('Author could not be created');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.AUTHOR,
            action: EAuthorAction.CREATE,
            description: `Created author "${createdAuthor.name}"`,
            targetId: createdAuthor._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return createdAuthor;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Author creation failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async updateAuthorIntoDB(authUser: IAuthUser, id: string, payload: IUpdateAuthorPayload) {
    // Validate id
    validateObjectId(id);
    // Find the author by ID
    const author = await Author.findOne({
      _id: objectId(id),
      status: {
        $ne: EAuthorStatus.DELETED,
      },
    });

    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    // Initialize slug with the current one
    let slug = author.slug;

    // If the name is being changed, regenerate the slug
    if (payload.name && payload.name !== author.name) {
      slug = generateSlug(payload.name);
      let count = 2;

      // Ensure the new slug is unique
      while (await Author.findOne({ slug })) {
        slug = generateSlug(`${payload.name} ${count}`);
        count++;
      }
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const authorUpdateStatus = await Author.updateOne(
        { _id: author._id },
        {
          ...payload,
          slug,
        },
        { session }
      );

      if (!authorUpdateStatus) {
        throw new Error('Author could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.AUTHOR,
            action: EAuthorAction.CREATE,
            description: `Updated author`,
            targetId: author._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return await Author.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Author update failed'
      );
    } finally {
      await session.endSession();
    }
  }
  async changeAuthorStatusIntoDB(
    authUser: IAuthUser,
    id: string,
    payload: { status: EAuthorStatus }
  ) {
    const { status } = payload;

    // Find the author
    const author = await Author.findOne({
      _id: objectId(id),
      status: {
        $ne: EAuthorStatus.DELETED,
      },
    });

    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const authorUpdateStatus = await await Author.updateOne(
        { _id: objectId(id) },
        { status },
        { session }
      );

      if (!authorUpdateStatus) {
        throw new Error('Author could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.AUTHOR,
            action: EAuthorAction.CREATE,
            description: `Changed  author "${author.name}" status ${author.status} to ${payload.status} `,
            targetId: author._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return await Author.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Author change status failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async softDeleteAuthorIntoDB(authUser: IAuthUser, id: string) {
    // Validate id
    validateObjectId(id);
    // Find the author
    const author = await Author.findOne({
      _id: objectId(id),
      status: { $ne: EAuthorStatus.DELETED },
    });
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    const bookExist = await Book.find({
      author: author._id,
      status: {
        $ne: EBookStatus.DELETED,
      },
    }).countDocuments();

    // Check book existence
    if (bookExist) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `This author could not be deleted as it is associated with ${bookExist} books.`
      );
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Soft delete: Set the status to DELETED
      const authorUpdateStatus = await Author.updateOne(
        { _id: objectId },
        { status: EAuthorStatus.DELETED },
        { session }
      );

      if (!authorUpdateStatus) {
        throw new Error('Author could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.AUTHOR,
            action: EAuthorAction.CREATE,
            description: `Deleted  author "${author.name}" `,
            targetId: author._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      await session.commitTransaction();
      return await Author.findById(id);
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Author deletion failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async getPublicAuthorByIdFromDB(id: string) {
    const author = await Author.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status !== EAuthorStatus.ACTIVE) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }
    return author;
  }

  async getAuthorByIdFromDB(id: string) {
    const author = await Author.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status === EAuthorStatus.DELETED) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getPublicAuthorsFromDB(
    filterPayload: IGetPublicAuthorsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: EAuthorStatus.ACTIVE,
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
    const authors = await Author.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Author.countDocuments(whereConditions);

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

  async getAuthorsFromDB(
    filterPayload: IGetPublicAuthorsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EAuthorStatus.DELETED,
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
    const authors = await Author.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Author.countDocuments(whereConditions);

    const total = await Author.countDocuments({
      status: {
        $ne: EAuthorStatus.DELETED,
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

export default new AuthorService();
