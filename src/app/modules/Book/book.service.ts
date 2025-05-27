import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import Author from '../Author/author.model';
import { EGenreStatus } from '../Genre/genre.interface';
import Genre from '../Genre/genre.model';
import {
  EBookStatus,
  IBooksFilterPayload,
  ICreateBookPayload,
  IUpdateBookPayload,
} from './book.interface';
import Book from './book.model';
import BookCopy from '../BookCopy/book-copy.model';
import { startSession } from 'mongoose';
import { IAuthUser, IPaginationOptions } from '../../types';
import { calculatePagination, ESortOrder } from '../../helpers/paginationHelper';
import { isValidObjectId, objectId, throwInternalError, validateObjectId } from '../../helpers';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';
import cacheService from '../../cache/cache.service';
import AuditLog from '../AuditLog/audit-log.model';
import { EAuditLogCategory, EBookAction } from '../AuditLog/audit-log.interface';
import Notification from '../Notification/notification.model';
import User from '../User/user.model';
import { EUserRole, EUserStatus } from '../User/user.interface';

class BookService {
  async createBookIntoDB(authUser: IAuthUser, payload: ICreateBookPayload) {
    const genreExist = await Genre.findOne({
      _id: Object(payload.genreId),
      status: EGenreStatus.ACTIVE,
    });

    //  Check if genre exist
    if (!genreExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    const authorExist = await Author.findOne({
      _id: Object(payload.authorId),
      status: EGenreStatus.ACTIVE,
    });

    //  Check if author exist
    if (!authorExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    //  Start session for rollback
    const session = await startSession();
    session.startTransaction();

    const payloadCopies = payload.copies;

    try {
      const bookData = {
        name: payload.name,
        genre: payload.genreId,
        author: payload.authorId,
        coverPhotoUrl: payload.coverPhotoUrl,
        count: {
          totalCopies: payloadCopies ? payloadCopies.length : 0,
          availableCopies: payloadCopies ? payloadCopies.length : 0,
        },
      };
      // Create book
      const [createdBook] = await Book.create([bookData], { session });

      if (!createdBook) {
        throw new Error('Book creation failed');
      }

      let createdCopies;
      if (payloadCopies?.length) {
        // Append book id with provided copies
        const copiesData = (payload.copies as any[]).map((_) => {
          _.book = createdBook._id;
          return _;
        });

        // Create book copies
        createdCopies = await BookCopy.create(copiesData, { session, ordered: true });

        if (!createdCopies.length) {
          throw new Error();
        }

        // Create audit log
        const [createdLog] = await AuditLog.create(
          [
            {
              category: EAuditLogCategory.BOOK,
              action: EBookAction.CREATE,
              description: `Created book "${bookData.name}" with ${payloadCopies.length} copies `,
              targetId: createdBook._id,
              performedBy: authUser.userId,
            },
          ],
          { session }
        );

        if (!createdLog) {
          throw new Error('Audit log creation failed');
        }

        const managementUsers = await User.find({
          role: {
            $ne: EUserRole.STUDENT,
          },
          status: EUserStatus.ACTIVE,
        }).select('_id');

        const notificationData = managementUsers.map((user) => ({
          user: user._id,
          title: 'New book added',
          message: `A new book named "${createdBook.name}" has been added to the library.`,
        }));
        Notification.create(notificationData);
      }
      await Author.updateOne(
        { _id: objectId(payload.authorId) },
        { $inc: { 'count.books': 1 } },
        { session }
      );
      await Genre.updateOne(
        { _id: objectId(payload.genreId) },
        { $inc: { booksCount: 1 } },
        { session }
      );

      cacheService.cacheRecentAddedBookId(createdBook._id.toString());

      await session.commitTransaction();
      return {
        book: createdBook,
        copies: createdCopies || null,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Book create operation failed');
    } finally {
      session.endSession();
    }
  }

  async updateBookIntoDB(authUser: IAuthUser, id: string, payload: IUpdateBookPayload) {
    const book = await Book.findById(id);
    // Check book existence
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, "Book does'nt exist");
    }

    // If book name has been changed then Check if a book with the same name already exists

    if (payload.name && payload.name !== book.name) {
      const existingBook = await Book.findOne({ name: payload.name });
      if (existingBook) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'A book with the same name already exists.');
      }
    }
    //If Genre has been changed then Validate that the provided genre exists
    if (payload.genre && payload.genre !== book.genre.toString()) {
      const genre = await Genre.findById(payload.genre);
      if (!genre) {
        throw new AppError(httpStatus.NOT_FOUND, 'Genre does not exist.');
      }
    }
    // If Author has been changed then Validate that the provided author exists
    if (payload.author && payload.author !== book.author.toString()) {
      const author = await Author.findById(payload.author);
      if (!author) {
        throw new AppError(httpStatus.NOT_FOUND, 'Author does not exist.');
      }
    }

    const session = await startSession();
    session.startTransaction();

    try {
      const updatedBook = await Book.findByIdAndUpdate(id, payload, { session, new: true });
      if (payload.author && payload.author !== book.author.toString()) {
        // decrease(-1) previous author books count
        await Author.updateOne({ _id: book.author }, { $inc: { 'count.books': -1 } }, { session });
        // Increase(1) updated author books count
        await Author.updateOne(
          { _id: objectId(payload.author) },
          { $inc: { 'count.books': 1 } },
          { session }
        );
      }
      if (payload.genre && payload.genre !== book.genre.toString()) {
        // decrease(-1) previous genre books count
        await Genre.updateOne({ _id: book.author }, { $inc: { booksCount: -1 } }, { session });
        // Increase(1) updated genre books count
        await Genre.updateOne(
          { _id: objectId(payload.author) },
          { $inc: { booksCount: 1 } },
          { session }
        );
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.BOOK,
            action: EBookAction.UPDATE,
            description: `Updated book ID:${id} `,
            targetId: id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      await session.commitTransaction();
      return updatedBook;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Book could not be updated'
      );
    } finally {
      await session.endSession();
    }
  }

  async getPublicBooksFromDB(
    filterPayload: IBooksFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions, {
      defaultSortBy: false,
    });
    const { searchTerm, genreIds, authorIds } = filterPayload;

    // Initialize filter conditions with active book status
    const whereConditions: Record<string, any> = {
      status: EBookStatus.ACTIVE,
    };

    // Apply search filter on book name
    if (searchTerm) {
      whereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    // Filter by genre IDs if provided
    if (genreIds) {
      const ids = genreIds.split(',').map((id) => objectId(id));
      whereConditions.genre = { $in: ids };
    }

    // Filter by author IDs if provided
    if (authorIds) {
      const ids = authorIds.split(',').map((id) => objectId(id));
      whereConditions.author = { $in: ids };
    }

    // Fetch filtered books with pagination and sorting
    const books = await Book.find(whereConditions)
      .sort(sortBy ? { [sortBy]: sortOrder as ESortOrder } : { index: 'desc' })
      .skip(skip as number)
      .limit(limit as number)
      .populate(['author', 'genre']);

    // Count for pagination
    const totalResult = await Book.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        totalResult: totalResult,
      },
      data: books,
    };
  }
  async getBooksFromDB(filterData: IBooksFilterPayload, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
    const { searchTerm, genreIds, authorIds, status } = filterData;

    // Initialize filter conditions with active book status
    const whereConditions: Record<string, any> = {
      status: EBookStatus.ACTIVE,
    };
    let isIdExist = false;
    // Apply search filter on book name
    if (searchTerm) {
      if (isValidObjectId(searchTerm)) {
        whereConditions._id = objectId(searchTerm);
        isIdExist = true;
      } else {
        whereConditions.name = { $regex: searchTerm, $options: 'i' };
      }
    }

    if (!isIdExist) {
      // Filter by genre IDs if provided
      if (genreIds) {
        const ids = genreIds.split(',').map((id) => objectId(id));
        whereConditions.genre = { $in: ids };
      }

      // Filter by author IDs if provided
      if (authorIds) {
        const ids = authorIds.split(',').map((id) => objectId(id));
        whereConditions.author = { $in: ids };
      }
    }

    // Fetch filtered books with pagination and sorting
    const books = await Book.find(whereConditions)
      .sort({ [sortBy as string]: sortOrder as ESortOrder })
      .skip(skip as number)
      .limit(limit as number)
      .populate(['author', 'genre']);

    // Count for pagination
    const totalResults = await Book.countDocuments(whereConditions);

    return {
      meta: {
        page,
        limit,
        total: totalResults,
      },
      data: books,
    };
  }
  async getPublicBookByIdFromDB(id: string) {
    const book = await Book.findOne({ _id: objectId(id), status: EBookStatus.ACTIVE }).populate([
      'genre',
      'author',
    ]);
    // Check book existence
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist");
    }
    return book;
  }

  async getBookByIdFromDB(id: string) {
    const book = await Book.findOne({
      _id: objectId(id),
      status: { $ne: EBookStatus.DELETED },
    }).populate(['genre', 'author']);
    // Check book existence
    if (!book) {
      throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist");
    }

    return book;
  }

  async changeBookStatusIntoDB(authUser: IAuthUser, id: string, payload: { status: EBookStatus }) {
    validateObjectId(id);
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EBookStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }
    const book = await Book.findOne({ _id: objectId(id), status: { $ne: EBookStatus.DELETED } });
    if (!book) throw new AppError(httpStatus.NOT_FOUND, 'Book  not found');

    const session = await startSession();
    session.startTransaction();
    try {
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.BOOK,
            action: EBookAction.CREATE,
            description: `Changed book status ${book.status} to
                   ${payload.status} `,
            targetId: id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      // Perform the status update
      const authorUpdateStatus = await Author.updateOne(
        { _id: objectId(id) },
        { status },
        { new: true, session }
      );
      if (!authorUpdateStatus.modifiedCount) {
        throw new Error('Author update failed');
      }
      await session.commitTransaction();
      return {
        from: book.status,
        to: payload.status,
      };
    } catch (error) {
      await session.abortTransaction();
      throwInternalError();
    } finally {
      await session.endSession();
    }
  }

  async softDeleteBookFromDB(authUser: IAuthUser, id: string) {
    validateObjectId(id);
    const book = await Book.findOne({ _id: objectId(id), status: { $ne: EBookStatus.DELETED } });

    if (!book) throw new AppError(httpStatus.NOT_FOUND, 'Book  not found');
    const copyExist = await BookCopy.findOne({
      book: objectId(id),
      status: {
        $in: [EBookCopyStatus.CHECKED_OUT, EBookCopyStatus.RESERVED],
      },
    });

    // Check If any copy of this book is RESERVED or In checkout
    if (copyExist) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Book could not be delete because  Book already has a copy that is in checkout or reserved'
      );
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Set book status as  DELETED
      await Book.updateOne({ _id: book._id }, { status: EBookStatus.DELETED });
      // decrease  author books count -1
      await Author.updateOne({ _id: book.author }, { $inc: { 'count.books': -1 } });
      // decrease genre books count -1
      await Genre.updateOne({ _id: book.genre }, { $inc: { booksCount: -1 } });
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.BOOK,
            action: EBookAction.CREATE,
            description: `Delete book "${book.name}" ID:${book._id}`,
            targetId: id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }

      // Perform the status update
      const bookUpdateStatus = await Author.updateOne(
        { _id: objectId(id) },
        { status },
        { new: true }
      );
      if (!bookUpdateStatus) {
        throw new Error('Bok update failed');
      }

      const managementUsers = await User.find({
        role: {
          $ne: EUserRole.STUDENT,
        },
        status: EUserStatus.ACTIVE,
      }).select('_id');

      const notificationData = managementUsers.map((user) => ({
        user: user._id,
        title: 'Book removed',
        message: `A book named "${book.name}" has been removed from the library.`,
      }));
      Notification.create(notificationData);

      // After all success of all operation save them
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Book deletion failed'
      );
    } finally {
      await session.endSession();
    }

    return null;
  }

  async getNewArrivalBooksFromDB(paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortOrder, sortBy } = calculatePagination(paginationOptions);
    const books = await Book.find({
      isNewArrival: true,
    })
      .sort(sortBy ? { [sortBy]: sortOrder as ESortOrder } : { index: 'desc' })
      .skip(skip as number)
      .limit(limit as number)
      .populate(['category', 'author']);

    const totalResult = await Book.countDocuments({ isNewArrival: true });

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: books,
      meta,
    };
  }
}

export default new BookService();
