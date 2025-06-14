import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import departmentService from './department.service';

class DepartmentController {
  createDepartment = catchAsync(async (req, res) => {
    const result = await departmentService.createDepartmentIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Department created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  // updateDepartment =  catchAsync(async (req, res) => {
  //   const result = await departmentService.(req.body);
  //   sendSuccessResponse(res, {
  //     message: 'Department updated successfully',
  //     statusCode: httpStatus.OK,
  //     data: result,
  //   });
  // });
  getDepartments = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await departmentService.getDepartmentsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Departments retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getPublicDepartments = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await departmentService.getPublicDepartmentsFromDB(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Departments retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getPublicDepartmentById = catchAsync(async (req, res) => {
    const result = await departmentService.getPublicDepartmentByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Department retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getDepartmentById = catchAsync(async (req, res) => {
    const result = await departmentService.getDepartmentByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Department retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new DepartmentController();
