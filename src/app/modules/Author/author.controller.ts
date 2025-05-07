import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import authorService from './author.service';

class AuthorController {
  createAuthor = catchAsync(async (req, res) => {
    const result = await authorService.createAuthorIntoDB(req.body);
    sendSuccessResponse(res, {
      message: 'Author created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  updateAuthor = catchAsync(async (req, res) => {
    const result = await authorService.updateAuthorIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Author updated successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  changeAuthorStatusIntoDB = catchAsync(async (req, res) => {
    const result = await authorService.changeAuthorStatusIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Author status changed successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  softDeleteAuthor = catchAsync(async (req, res) => {
    const result = await authorService.changeAuthorStatusIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Author deleted successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getPublicAuthors = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await authorService.getPublicAuthorsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Author retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getPublicAuthorById = catchAsync(async (req, res) => {
    const result = await authorService.getPublicAuthorByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Author retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getAuthors = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await authorService.getAuthorsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Author retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getAuthorById = catchAsync(async (req, res) => {
    const result = await authorService.getAuthorByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Author retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new AuthorController();
