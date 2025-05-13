import { z } from 'zod';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import { EUserRole } from '../../type';
import {
  AdminDefaultPermissions,
  LibrarianDefaultPermissions,
  StudentDefaultPermissions,
  SuperAdminDefaultPermissions,
} from './role-permission.constant';
import { IRolePermission } from './role-permission.interface';
import RolePermission from './role-permission.model';
import rolePermissionValidation from './role-permission.validation';

class RolePermissionService {
  /**
   * Creates default role permissions in the database
   * if they don't already exist.
   */
  async createDefaultRolePermissionsIntoDB() {
    const permissions = await RolePermission.find();

    const studentPermissionExist = permissions.find((p) => p.role === EUserRole.STUDENT);
    const librarianPermissionExist = permissions.find((p) => p.role === EUserRole.LIBRARIAN);
    const adminPermissionExist = permissions.find((p) => p.role === EUserRole.ADMIN);
    const superAdminPermissionExist = permissions.find((p) => p.role === EUserRole.SUPER_ADMIN);

    if (!superAdminPermissionExist) {
      await RolePermission.create({
        role: EUserRole.SUPER_ADMIN,
        permissions: SuperAdminDefaultPermissions,
      });
    }

    if (!adminPermissionExist) {
      await RolePermission.create({
        role: EUserRole.ADMIN,
        permissions: AdminDefaultPermissions,
      });
    }

    if (!librarianPermissionExist) {
      await RolePermission.create({
        role: EUserRole.LIBRARIAN,
        permissions: LibrarianDefaultPermissions,
      });
    }

    if (!studentPermissionExist) {
      await RolePermission.create({
        role: EUserRole.STUDENT,
        permissions: StudentDefaultPermissions,
      });
    }
  }

  /**
   * Updates role permissions for a given role
   */
  async updateRolePermissionsIntoDB(
    role: EUserRole,
    payload: Partial<Pick<IRolePermission, 'permissions'>>
  ) {
    // Validate role
    if (!z.nativeEnum(EUserRole).safeParse(role).success) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid role');
    }
    
    // Validate payload base on roll

    switch (role){
      case EUserRole.STUDENT:
      rolePermissionValidation.updateStudentPermissions.parse(payload);
      break;
      case EUserRole.LIBRARIAN:
      rolePermissionValidation.updateLibrarianPermissions.parse(payload)
      break
      case EUserRole.ADMIN:
      rolePermissionValidation.updateAdminPermissions.parse(payload)
      break
      case EUserRole.SUPER_ADMIN:
      rolePermissionValidation.updateAdminPermissions.parse(payload)
      break
    }


    const permission = await RolePermission.findOne({ role });

    if (!permission) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Permission update failed!');
    }

    // Ensure the permissions are editable
    if (!permission.permissions.isEditable) {
      throw new AppError(httpStatus.FORBIDDEN, 'Permissions are not editable');
    }

    // Update permissions
    await RolePermission.findOneAndUpdate({ role }, { permissions: payload }, { new: true });
  }

  /**
   * Retrieves all role permissions from the database
   */
  async getAllRolePermissionsFromDB() {
    return await RolePermission.find();
  }

  /**
   * Retrieves permissions for a specific role
   */
  async getRolePermissionsFromDB(role: EUserRole) {
    // Validate role
    if (!z.nativeEnum(EUserRole).safeParse(role).success) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid role');
    }

    return await RolePermission.findOne({ role });
  }
}

export default new RolePermissionService();
