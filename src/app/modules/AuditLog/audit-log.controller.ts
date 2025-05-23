import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import auditLogService from './audit-log.service';

class AuditLogController {
  getAuditLogs = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await auditLogService.getAuditLogsFromDB(req.user, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Audit logs retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getAuditLogById = catchAsync(async (req, res) => {
    const result = await auditLogService.getAuditLogByIdFromDB(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Audit log retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new AuditLogController();
