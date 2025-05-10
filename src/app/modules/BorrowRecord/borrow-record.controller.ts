import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import borrowRecordService from './borrow-record.service';

class BorrowRecordController {
  processBorrowRecord = catchAsync(async (req, res) => {
    const result = await borrowRecordService.processBorrowIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Borrow has been processed successfully!',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  getBorrowRecords = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['roll', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await borrowRecordService.getBorrowRecordsFromDB(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Borrow records retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyBorrowRecords = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await borrowRecordService.getMyBorrowRecordsFromDB(req.user, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Borrow requests retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyBorrowRecordById = catchAsync(async (req, res) => {
    const result = await borrowRecordService.getMyBorrowRecordById(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Borrow records retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getBorrowRecordById = catchAsync(async (req, res) => {
    const result = await borrowRecordService.getBorrowRecordById(req.params.id);
    sendSuccessResponse(res, {
      message: 'Borrow record retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new BorrowRecordController();
