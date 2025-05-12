import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import bookReviewService from './book-review.service';

class BookReviewController {
  createBookReview = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['roll', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await bookReviewService.createBookReview(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Borrow review created successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getBookReviews = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['roll', 'bookId', 'status', 'minRatting', 'maxRatting']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await bookReviewService.getBookReviewsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Book reviews successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getBookReviewById = catchAsync(async (req, res) => {
    const result = await bookReviewService.getBookReviewById(req.params.id);
    sendSuccessResponse(res, {
      message: 'Book review retrieved successfully ',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getPublicBookReviewsByBookId = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await bookReviewService.getPublicBookReviewsByBookId(
      req.params.bookId,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Book reviews successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getPublicBookReviewById = catchAsync(async (req, res) => {
    const result = await bookReviewService.getBookReviewById(req.params.id);
    sendSuccessResponse(res, {
      message: 'Book review retrieved successfully ',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  changeBookReviewStatus = catchAsync(async (req, res) => {
    const result = await bookReviewService.changeBookReviewStatus(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Book review status changed successfully ',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  softDeleteBookReview = catchAsync(async (req, res) => {
    const result = await bookReviewService.softDeleteBookReviewIntoDB(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Book deleted successfully ',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new BookReviewController();
