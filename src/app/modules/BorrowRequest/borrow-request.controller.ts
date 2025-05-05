import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import BorrowRequest from './borrow-request.model';
import BorrowRequestServices from './borrow-request.service';

const createBorrowRequest = catchAsync(async (req, res) => {
  const result = await BorrowRequestServices.createBorrowRequestIntoDB(req.user, req.body);
  sendSuccessResponse(res, {
    message: 'Your Request has been submitted successfully',
    statusCode: httpStatus.CREATED,
    data: result,
  });
});

const approveBorrowRequest = catchAsync(async (req, res) => {
  const result = await BorrowRequestServices.approveBorrowRequest(req.params.id, req.body);
  sendSuccessResponse(res, {
    message: 'Request has been approved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const rejectBorrowBorrowRequest = catchAsync(async (req, res) => {
  const result = await BorrowRequestServices.approveBorrowRequest(req.params.id, req.body);
  sendSuccessResponse(res, {
    message: 'Request has been rejected successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getPendingBorrowRequests = catchAsync(async (req, res) => {
  const filters = Pick(req.query, ['roll']);
  const paginationOptions = paginationOptionPicker(req.query);
  const result = await BorrowRequestServices.getPendingBorrowRequestsForManageFromDB(
    filters,
    paginationOptions
  );
  sendSuccessResponse(res, {
    message: 'Borrow requests retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getMyBorrowRequests = catchAsync(async (req, res) => {
  const paginationOptions = paginationOptionPicker(req.query);
  const result = await BorrowRequestServices.getMyBorrowRequestsFromDB(req.user, paginationOptions);
  sendSuccessResponse(res, {
    message: 'Borrow requests retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const BorrowRequestControllers = {
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowBorrowRequest,
  getPendingBorrowRequests,
  getMyBorrowRequests,
};

export default BorrowRequestControllers;
