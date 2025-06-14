import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import fineService from './fine.service';

class FineController {
  getFines = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['roll', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await fineService.getFinesFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Fines retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyFines = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await fineService.getFinesFromDB(req.user, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Fines retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyFineById = catchAsync(async (req, res) => {
    const result = await fineService.getMyFineById(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Fine retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getFineById = catchAsync(async (req, res) => {
    const result = await fineService.getFineById(req.params.id);
    sendSuccessResponse(res, {
      message: 'Fine retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  changeFineStatus = catchAsync(async (req, res) => {
    const result = await fineService.changeFineStatusIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'Fine status changed successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  waveFine = catchAsync(async (req, res) => {
    const result = await fineService.waiveFineIntoDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Fine waved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  payFine = catchAsync(async (req, res) => {
    const result = await fineService.payFineIntoDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Fine paid successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new FineController();
