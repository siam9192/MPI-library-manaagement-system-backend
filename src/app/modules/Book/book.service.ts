import { Schema, Types } from 'mongoose';
import AppError from '../../Errors/AppError';
import { objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IPaginationOptions } from '../../types';
import Author from '../Author/author.model';
import { EBorrowStatus } from '../Borrow/borrow.interface';
import Borrow from '../Borrow/borrow.model';
import Genre from '../Genre/genre.model';
import { EReservationStatus } from '../Reservation/reservation.interface';
import Reservation from '../Reservation/reservation.model';
import {
  EBookStatus,
  IBooksFilterData,
  ICreateBookPayload,
  IManageBooksFilterData,
  IUpdateBookPayload,
} from './book.interface';
import Book from './book.model';

const createBookIntoDB = async (payload: ICreateBookPayload) => {
  // Check if a book with the same name already exists
  const existingBook = await Book.findOne({ name: payload.name });
  if (existingBook) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'A book with the same name already exists.');
  }

  // Validate that the provided genre exists
  const genre = await Genre.findById(payload.genre);
  if (!genre) {
    throw new AppError(httpStatus.NOT_FOUND, 'Genre does not exist.');
  }

  // Validate that the provided author exists
  const author = await Author.findById(payload.author);
  if (!author) {
    throw new AppError(httpStatus.NOT_FOUND, 'Author does not exist.');
  }

  // Create and return the new book record
  return await Book.create(payload);
};

const updateBookIntoDB = async (id: string, payload: IUpdateBookPayload) => {
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

  // Create and return the new book record
  return await Book.create(payload);
};

const deleteBookFromDB = async (id: string) => {
  // Check if the book exists
  const book = await Book.findById(id);
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist.");
  }

  // Check if there is an ongoing borrow record associated with this book
  const runningBorrowExist = await Borrow.findOne({
    bookId: objectId(id),
    status: {
      $in: [EBorrowStatus.ONGOING, EBorrowStatus.OVERDUE], // Adjust statuses if needed
    },
  });

  const reserved = await Reservation.findOne({
    book: objectId(id),
    status: EReservationStatus.AWAITING_PICKUP,
  });

  if (runningBorrowExist || reserved) {
    throw new AppError(
      httpStatus.NOT_ACCEPTABLE,
      'Book cannot be deleted while it is currently borrowed or reserved.'
    );
  }

  // Delete the book
  const deleteStatus = await Book.deleteOne({ _id: objectId(id) });
  if (!deleteStatus.deletedCount)
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Book could not be deleted,Something went wrong'
    );
  return null;
};

const softDeleteIntoDB = async (id: string) => {
  // Check if the book exists
  const book = await Book.findOne({
    _id: objectId(id),
    status: EBookStatus.DELETED,
  });
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist.");
  }

  // Check if there is an ongoing borrow record associated with this book
  const runningBorrowExist = await Borrow.findOne({
    bookId: objectId(id),
    status: {
      $in: [EBorrowStatus.ONGOING, EBorrowStatus.OVERDUE], // Adjust statuses if needed
    },
  });

  const reserved = await Reservation.findOne({
    book: objectId(id),
    status: EReservationStatus.AWAITING_PICKUP,
  });

  if (runningBorrowExist || reserved) {
    throw new AppError(
      httpStatus.NOT_ACCEPTABLE,
      'Book cannot be deleted while it is currently borrowed or reserved.'
    );
  }

  // Delete the book
  const deleteStatus = await Book.updateOne({ _id: objectId(id) }, { status: EBookStatus.DELETED });
  if (!deleteStatus.modifiedCount)
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Book could not be deleted,Something went wrong'
    );
  return null;
};

const getBooksFromDB = async (
  filterData: IBooksFilterData,
  paginationOptions: IPaginationOptions
) => {
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
  const { searchTerm, genreIds, authorIds } = filterData;

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
};

const getBooksForManageFromDB = async (
  filterData: IManageBooksFilterData,
  paginationOptions: IPaginationOptions
) => {
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
  const { searchTerm, genreIds, authorIds, status } = filterData;

  // Initialize filter conditions with active book status
  const whereConditions: Record<string, any> = {
    status: EBookStatus.ACTIVE,
  };
  let isIdExist = false;
  // Apply search filter on book name
  if (searchTerm) {
    if (Types.ObjectId.isValid(searchTerm)) {
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
};

const getBookFromDB = async (id: string) => {
  const book = await Book.findOne({ _id: objectId(id), status: EBookStatus.ACTIVE }).populate([
    'genre',
    'author',
  ]);
  // Check book existence
  if (!book) {
    throw new AppError(httpStatus.NOT_FOUND, "Book doesn't exist");
  }
  return book;
};

const BookServices = {
  createBookIntoDB,
  updateBookIntoDB,
  softDeleteIntoDB,
  deleteBookFromDB,
  getBooksFromDB,
  getBooksForManageFromDB,
  getBookFromDB,
};

export default BookServices;
