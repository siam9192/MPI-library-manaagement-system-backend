import e from 'express';
import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import BorrowServices from './borrow.service';

const createBorrowRequest = catchAsync(async (req, res) => {
  const result = await BorrowServices.createBorrowIntoDB(req.user, req.params.token);
  sendSuccessResponse(res, {
    message: 'Book has been handed over successfully!',
    statusCode: httpStatus.CREATED,
    data: result,
  });
});

const returnBorrow = catchAsync(async (req, res) => {
  const result = await BorrowServices.returnBorrowIntoDB(req.params.id, req.body);
  sendSuccessResponse(res, {
    message: 'Book has been returned successfully!',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getAllPendingBorrows = catchAsync(async (req, res) => {
  const filter = Pick(req.query, ['roll']);
  const paginationOptions = paginationOptionPicker(req.query);
  const result = await BorrowServices.getPendingReturnsFromDB(filter, paginationOptions);
  sendSuccessResponse(res, {
    message: 'Pending borrows has been retrieved successfully!',
    statusCode: httpStatus.OK,
    ...result,
  });
});

const BorrowControllers = {
  createBorrowRequest,
  returnBorrow,
  getAllPendingBorrows,
};

export default BorrowControllers;
