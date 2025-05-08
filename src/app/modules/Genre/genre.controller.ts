import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import genreService from './genre.service';

class GenreController {
  createGenre = catchAsync(async (req, res) => {
    const result = await genreService.createGenreIntoDB(req.body);
    sendSuccessResponse(res, {
      message: 'Genre created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  updateGenre = catchAsync(async (req, res) => {
    const result = await genreService.updateGenreIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Genre updated successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  changeGenreStatus = catchAsync(async (req, res) => {
    const result = await genreService.changeGenreStatusIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Genre status changed successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  softDeleteGenre = catchAsync(async (req, res) => {
    const result = await genreService.softDeleteGenreIntoDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Genre deleted successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getPublicGenres = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await genreService.getPublicGenresFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Genres retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getPublicGenreById = catchAsync(async (req, res) => {
    const result = await genreService.getPublicGenreByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Genre retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getGenres = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await genreService.getGenresFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Genre retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getGenreById = catchAsync(async (req, res) => {
    const result = await genreService.getGenreByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Genre retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new GenreController();
