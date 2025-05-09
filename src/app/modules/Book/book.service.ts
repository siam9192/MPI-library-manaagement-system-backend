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
import { IPaginationOptions } from '../../types';
import { calculatePagination } from '../../helpers/paginationHelper';
import { isValidObjectId, objectId } from '../../helpers';
import { EBookCopyStatus } from '../BookCopy/book-copy.interface';

class BookService {
  async createBookIntoDB(payload: ICreateBookPayload) {
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

    try {
      const bookData = {
        name: payload.name,
        genre: payload.genreId,
        author: payload.authorId,
        coverPhotoUrl: payload.coverPhotoUrl,
        count: {
          totalCopies: payload.copies.length,
          availableCopies: payload.copies.length,
        },
      };
      // Create book
      const [createdBook] = await Book.create([bookData], { session });

      if (!createdBook) {
        throw new Error();
      }

      // Append book id with provided copies
      const copiesData = (payload.copies as any[]).map((_) => {
        _.book = createdBook._id;
        return _;
      });

      // Create book copies
      const createdCopies = await BookCopy.create(copiesData, { session, ordered: true });

      if (!createdCopies.length) {
        throw new Error();
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
      await session.commitTransaction();
      return {
        book: createdBook,
        copies: createdCopies,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Book create operation failed');
    } finally {
      session.endSession();
    }
  }

  async updateBookIntoDB(id: string, payload: IUpdateBookPayload) {
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
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
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
      .sort({ [sortBy]: sortOrder, index: 1 })
      .skip(skip)
      .limit(limit)
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
      .sort({ [sortBy]: sortOrder, index: 1 })
      .skip(skip)
      .limit(limit)
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

  async changeBookStatusIntoDB(id: string, payload: { status: EBookStatus }) {
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EBookStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

   const book =  await Book.findOne({_id:objectId(id),status:{$ne:EBookStatus.DELETED}})
    if(!book) throw new AppError(httpStatus.NOT_FOUND,"Book  not found")

    // Perform the status update
    return await Author.findByIdAndUpdate(
      id,
      { status },
      { new: true } // return the updated document
    );
  }

  async  softDeleteBookFromDB (id:string){
    const book =  await Book.findOne({_id:objectId(id),status:{$ne:EBookStatus.DELETED}})
    if(!book) throw new AppError(httpStatus.NOT_FOUND,"Book  not found")
    const copyExist = await BookCopy.findOne({
     book:objectId(id),
     status:{
      $in:[EBookCopyStatus.CHECKED_OUT,EBookCopyStatus.RESERVED]
     }
    })

    // Check If any copy of this book is RESERVED or In checkout 
    if(copyExist){
    throw new AppError(httpStatus.FORBIDDEN, "Book could not be delete because  Book already has a copy that is in checkout or reserved");
    }

    const session = await startSession()
    session.startTransaction()

   try {
    // Set book status as  DELETED 
    await Book.updateOne({_id:book._id},{status:EBookStatus.DELETED}
    )
    // decrease  author books count -1
    await Author.updateOne({_id:book.author},{$inc:{'count.books':-1}})
      // decrease genre books count -1
    await Genre.updateOne({_id:book.genre},{$inc:{booksCount:-1}})
    // After all success of all operation save them 
    await session.commitTransaction()
   } catch (error) {
     await session.abortTransaction()
     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR,"Internal server error!.Book deletion failed")
   }

   finally{
    await session.endSession()
   }

    return null
  }
}

export default new BookService();
