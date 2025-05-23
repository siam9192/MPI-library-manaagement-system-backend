import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import holdBorrowRequestService from './hold-borrow-request.service';

class HoldBorrowRequestController {
  createHoldBorrowRequest = catchAsync(async (req, res) => {
    const result = await holdBorrowRequestService.createHoldBorrowRequestIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Hold borrow request  created successfully!',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  getMyHoldBorrowRequestsFromDB = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await holdBorrowRequestService.getMyHoldBorrowRequestsFromDB(
      req.user,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Hold borrow requests  retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  deleteHoldBorrowRequestFromDB = catchAsync(async (req, res) => {
    const result = await holdBorrowRequestService.deleteBorrowRequestFromDB(
      req.user,
      req.params.id
    );
    sendSuccessResponse(res, {
      message: 'Hold borrow request deleted successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new HoldBorrowRequestController();
