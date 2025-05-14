import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import supportService from './support.service';

class SupportController {
  createSupportIntoDB = catchAsync(async (req, res) => {
    const result = await supportService.createSupportIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Support created  successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  getReservations = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const filterPayload = Pick(req.query, ['roll', 'status']);
    const result = await supportService.getSupportsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Supports retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getSupportById = catchAsync(async (req, res) => {
    const result = await supportService.getSupportByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Support retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMySupportById = catchAsync(async (req, res) => {
    const result = await supportService.getSupportByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Support retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  resolveSupport = catchAsync(async (req, res) => {
    const result = await supportService.resolveSupportIntoDB(req.user, req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Support resolved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  setSupportAsFailed = catchAsync(async (req, res) => {
    const result = await supportService.setSupportAsFailedIntoDB(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Support set as failed successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new SupportController();
