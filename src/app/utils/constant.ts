import { EUserRole } from "../type";

export const paginationOptionKeys = ['page', 'limit', 'sortBy', 'sortOrder'];


export const managementRoles = [EUserRole.SUPER_ADMIN,EUserRole.ADMIN,EUserRole.LIBRARIAN]

export const allRoles = Object.values(EUserRole)