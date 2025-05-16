import { paginationOptionPicker } from "../../helpers/paginationHelper";
import httpStatus from "../../shared/http-status";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import borrowHistoryService from "./borrow-history.service";

class BorrowHistoryController {
   getMyBorrowHistories = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await borrowHistoryService.getMyBorrowHistoriesFromDB(req.user, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Borrow history retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

   getMyBorrowHistoryById = catchAsync(async (req, res) => {
    const result = await borrowHistoryService.getMyBorrowHistoryByIdFromDB(req.user,req.params.id);
    sendSuccessResponse(res, {
      message: 'Borrow history retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}


export default new BorrowHistoryController();