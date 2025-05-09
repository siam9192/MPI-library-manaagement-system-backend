import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import borrowRequestService from './borrow-request.service';

class BorrowRequestController {
  createBorrowRequest = catchAsync(async (req, res) => {
    const result = await borrowRequestService.createBorrowRequestIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Borrow request has been created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  approveBorrowRequest = catchAsync(async (req, res) => {
    const result = await borrowRequestService.approveBorrowRequest(
      req.user,
      req.params.id,
      req.body
    );
    sendSuccessResponse(res, {
      message: 'Request has been approved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  rejectBorrowBorrowRequest = catchAsync(async (req, res) => {
    const result = await borrowRequestService.approveBorrowRequest(
      req.user,
      req.params.id,
      req.body
    );
    sendSuccessResponse(res, {
      message: 'Request has been rejected successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getBorrowRequests = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['roll', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await borrowRequestService.getBorrowRequestsFromDB(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Borrow requests retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyBorrowRequests = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await borrowRequestService.getMyBorrowRequestsFromDB(
      req.user,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Borrow requests retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

getMyBorrowRequestById = catchAsync(async (req, res) => {
  
    const result = await borrowRequestService.getMyBorrowRequestById(req.user,req.params.id)
    sendSuccessResponse(res, {
      message: 'Borrow request retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });


getBorrowRequestById = catchAsync(async (req, res) => {
  
    const result = await borrowRequestService.getBorrowRequestById(req.params.id)
    sendSuccessResponse(res, {
      message: 'Borrow request retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

}

export default new BorrowRequestController();
