import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import statisticService from './statistic.service';

class StatisticController {
  getGlobalSummary = catchAsync(async (req, res) => {
    const result = await statisticService.getGlobalSummaryFromDB();
    sendSuccessResponse(res, {
      message: 'Global summary retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getStudentActivitySummary = catchAsync(async (req, res) => {
    const result = await statisticService.getStudentActivitySummaryFromDB(req.user);
    sendSuccessResponse(res, {
      message: 'Student activity summary retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getStudentMonthlyBorrowActivity = catchAsync(async (req, res) => {
    const range = req.query.range;
    const result = await statisticService.getStudentMonthlyBorrowActivityFromDB(
      req.user,
      range as any
    );
    sendSuccessResponse(res, {
      message: 'Student monthly borrow activity summary retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getSummaryForLibrarian = catchAsync(async (req, res) => {
    const result = await statisticService.getSummaryForLibrarianFromDB();
    sendSuccessResponse(res, {
      message: 'Student monthly borrow activity summary retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMonthlyBorrowActivity = catchAsync(async (req, res) => {
    const range = req.query.range;
    const result = await statisticService.getMonthlyBorrowActivityFromDB(range as any);
    sendSuccessResponse(res, {
      message: 'Monthly borrow activity retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMonthlyStudentRegistrationActivity = catchAsync(async (req, res) => {
    const range = req.query.range;
    const result = await statisticService.getMonthlyStudentRegistrationActivityFromDB(range as any);
    sendSuccessResponse(res, {
      message: 'Monthly student registration activity retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getBooksSummary = catchAsync(async (req, res) => {
    const result = await statisticService.getBooksSummaryFromDB();
    sendSuccessResponse(res, {
      message: 'Books summary retrieved successfully!',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new StatisticController();
