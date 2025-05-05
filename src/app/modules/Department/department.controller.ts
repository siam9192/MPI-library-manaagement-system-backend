import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import departmentService from './department.service';

class DepartmentController {
  createDepartment = catchAsync(async (req, res) => {
    const result = await departmentService.createDepartmentIntoDB(req.body);
    sendSuccessResponse(res, {
      message: 'Department created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  getDepartments = catchAsync(async (req, res) => {
    const result = await departmentService.getDepartmentForManage();
    sendSuccessResponse(res, {
      message: 'Departments retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new DepartmentController();
