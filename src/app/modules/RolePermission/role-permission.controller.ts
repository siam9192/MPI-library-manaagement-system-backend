import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import { EUserRole } from '../User/user.interface';
import rolePermissionService from './role-permission.service';

class RolePermissionController {
  updateRolePermissions = catchAsync(async (req, res) => {
    const result = await rolePermissionService.updateRolePermissionsIntoDB(
      req.params.role as EUserRole,
      req.body
    );
    sendSuccessResponse(res, {
      message: 'Permissions updated successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getAllRolePermissions = catchAsync(async (req, res) => {
    const result = await rolePermissionService.getAllRolePermissionsFromDB();
    sendSuccessResponse(res, {
      message: 'All Role Permissions retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getRolePermissions = catchAsync(async (req, res) => {
    const result = await rolePermissionService.getRolePermissionsFromDB(
      req.params.role as EUserRole
    );
    sendSuccessResponse(res, {
      message: 'Role Permissions retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new RolePermissionController();
