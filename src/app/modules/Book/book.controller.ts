import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import bookService from './book.service';

class BookController {
  createBook = catchAsync(async (req, res) => {
    const result = await bookService.createBookIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Book  created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  updateBook = catchAsync(async (req, res) => {
    const result = await bookService.updateBookIntoDB(req.user, req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Book  updated successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  changeBookStatus = catchAsync(async (req, res) => {
    const result = await bookService.changeBookStatusIntoDB(req.user, req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Book status changed successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getPublicBooks = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const filterData = Pick(req.query, ['searchTerm', 'genreIds', 'authorIds']);
    const result = await bookService.getPublicBooksFromDB(filterData, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Books retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getBooks = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const filterPayload = Pick(req.query, ['searchTerm', 'genreIds', 'authorIds', 'status']);
    const result = await bookService.getPublicBooksFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Books retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });
  getNewArrivalBooks = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await bookService.getNewArrivalBooksFromDB(paginationOptions);
    sendSuccessResponse(res, {
      message: 'Books retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getPublicBookById = catchAsync(async (req, res) => {
    const result = await bookService.getPublicBookByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Book retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getBookById = catchAsync(async (req, res) => {
    const result = await bookService.getBookByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Book retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  softDeleteBook = catchAsync(async (req, res) => {
    const result = await bookService.softDeleteBookFromDB(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Book deleted successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new BookController();
