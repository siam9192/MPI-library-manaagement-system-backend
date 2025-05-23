import AppError from '../../Errors/AppError';
import { isValidObjectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EUserRole, EUserStatus } from '../User/user.interface';
import AuditLog from './audit-log.model';

class AuditLogService {
  async getAuditLogsFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const role = authUser.role;

    const whereConditions: Record<string, unknown> = {
      status: {
        $ne: EUserStatus.DELETED,
      },
    };

    if (role === EUserRole.ADMIN) {
      whereConditions['performedBy.role'] = EUserRole.LIBRARIAN;
    }
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const base = [
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'performedBy',
          as: 'performedBy',
        },
      },
      {
        $unwind: '$performedBy',
      },
      {
        $match: whereConditions,
      },
    ];
    const logs = await AuditLog.aggregate([
      ...base,
      {
        $sort: {
          [sortBy]: sortOrder,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          'performedBy.password': false,
        },
      },
    ]);

    const totalResult =
      (
        await AuditLog.aggregate([
          ...base,
          {
            $count: 'total',
          },
        ])
      )[0].total || 0;

    const meta = {
      page,
      limit,
      totalResult,
    };
    return {
      data: logs,
      meta,
    };
  }

  async getAuditLogByIdFromDB(authUser: IAuthUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }

    const log = await AuditLog.findById(id);

    if (!log) {
      throw new AppError(httpStatus.NOT_FOUND, 'Audit log not found');
    }

    return log;
  }
}

export default new AuditLogService();
