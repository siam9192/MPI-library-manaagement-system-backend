import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { paginationOptionKeys } from '../../utils/constant';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import BookServices from './book.service';

const createBook = catchAsync(async (req, res) => {
  const result = await BookServices.createBookIntoDB(req.body);
  sendSuccessResponse(res, {
    message: 'Book has been created successfully',
    statusCode: httpStatus.CREATED,
    data: result,
  });
});

const updateBook = catchAsync(async (req, res) => {
  const result = await BookServices.updateBookIntoDB(req.params.id, req.body);
  sendSuccessResponse(res, {
    message: 'Book has been updated successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const deleteBook = catchAsync(async (req, res) => {
  const result = await BookServices.deleteBookFromDB(req.params.id);
  sendSuccessResponse(res, {
    message: 'Book has been deleted successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getBooks = catchAsync(async (req, res) => {
  const paginationOptions = paginationOptionPicker(req.query);
  const filterData = Pick(req.query, ['searchTerm', 'genreIds', 'authorIds']);
  const result = await BookServices.getBooksFromDB(filterData, paginationOptions);
  sendSuccessResponse(res, {
    message: 'Books retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getBooksForManage = catchAsync(async (req, res) => {
  const paginationOptions = paginationOptionPicker(req.query);

  const filterData = Pick(req.query, ['searchTerm', 'genreIds', 'authorIds', 'status']);
  const result = await BookServices.getBooksFromDB(filterData, paginationOptions);
  sendSuccessResponse(res, {
    message: 'Books retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getBook = catchAsync(async (req, res) => {
  const result = await BookServices.getBookFromDB(req.params.id);
  sendSuccessResponse(res, {
    message: 'Book retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const BookControllers = {
  createBook,
  updateBook,
  deleteBook,
  getBooks,
  getBooksForManage,
  getBook,
};

export default BookControllers;
