import { startSession } from 'mongoose';
import AppError from '../../Errors/AppError';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EAuditLogCategory, EDepartmentAction } from '../AuditLog/audit-log.interface';
import AuditLog from '../AuditLog/audit-log.model';
import {
  EDepartmentStatus,
  ICreateDepartmentPayload,
  IDepartmentsFilterPayload,
  IPublicDepartmentsFilterPayload,
} from './department.interface';
import Department from './department.model';
import { isValidObjectId, objectId } from '../../helpers';

class DepartmentService {
  async createDepartmentIntoDB(authUser: IAuthUser, payload: ICreateDepartmentPayload) {
    // Remove white space
    payload.name = payload.name.trim();
    payload.shortName = payload.shortName.trim();

    //   Checking department existence
    const department = await Department.findOne({
      $or: [
        {
          name: payload.name,
        },
        {
          shortName: payload.shortName,
        },
      ],
      status: {
        $ne: EDepartmentStatus.DELETED,
      },
    });

    if (department) {
      if (department.name === payload.name) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Department is already exist on this name');
      } else {
        throw new AppError(
          httpStatus.NOT_ACCEPTABLE,
          'Department is already exist on this short name'
        );
      }
    }

    const session = await startSession();

    session.startTransaction();

    try {
      const [createdDepartment] = await Department.create([payload], { session });

      if (!createdDepartment) {
        throw new Error('Department could not be created');
      }

      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.DEPARTMENT,
            action: EDepartmentAction.CREATE,
            description: `Created name a new department`,
            targetId: createdDepartment._id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );
      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Department creation failed.Internal server error'
      );
    } finally {
      await session.endSession();
    }
  }

  async softDeleteDepartmentIntoDB(authUser: IAuthUser, id: string) {
    // Validation id
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }
    // Find the author
    const department = await Department.findById(id);
    if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    // Prevent deleting an already deleted author
    if (department.status === EDepartmentStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'This author is already deleted');
    }

    const session = await startSession();
    session.startTransaction();

    try {
      // Soft delete: Set the status to DELETED
      const departmentUpdateStatus = await Department.updateOne(
        { _id: objectId(id) },
        { status: EDepartmentStatus.DELETED },
        { session }
      );
      if (!departmentUpdateStatus.modifiedCount) {
        throw new Error('Department could not be updated');
      }
      // Create audit log
      const [createdLog] = await AuditLog.create(
        [
          {
            category: EAuditLogCategory.MANAGEMENT_REGISTRATION,
            action: EDepartmentAction.DELETE,
            description: `Deleted department ID:${department._id} `,
            targetId: department.id,
            performedBy: authUser.userId,
          },
        ],
        { session }
      );

      if (!createdLog) {
        throw new Error('Audit log creation failed');
      }
      return null;
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error!.Department deletion failed'
      );
    } finally {
      await session.endSession();
    }
  }

  async getPublicDepartmentsFromDB(
    filterPayload: IPublicDepartmentsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: EDepartmentStatus.ACTIVE,
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.$or = [
        {
          name: { $regex: searchTerm, $options: 'i' },
        },
        {
          shortName: { $regex: searchTerm, $options: 'i' },
        },
      ];
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Department.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Department.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: authors,
      meta,
    };
  }

  async getPublicDepartmentByIdFromDB(id: string) {
    const author = await Department.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status !== EDepartmentStatus.ACTIVE) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getDepartmentsFromDB(
    filterPayload: IDepartmentsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EDepartmentStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.$or = [
        {
          name: { $regex: searchTerm, $options: 'i' },
        },
        {
          shortName: { $regex: searchTerm, $options: 'i' },
        },
      ];
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Department.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Department.countDocuments(whereConditions);

    const total = await Department.countDocuments({
      status: {
        $ne: EDepartmentStatus.DELETED,
      },
    });

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: authors,
      meta,
    };
  }

  async getDepartmentByIdFromDB(id: string) {
    const department = await Department.findById(id);
    //  Check if author exist
    if (!department) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (department.status === EDepartmentStatus.DELETED) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }
    return department;
  }
}

export default new DepartmentService();
