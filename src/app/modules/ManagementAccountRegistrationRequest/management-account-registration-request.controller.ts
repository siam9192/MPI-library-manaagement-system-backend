import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import managementAccountRegistrationService from './management-account-registration-request.service';

class ManagementAccountRegistrationRequestController {
  createRegistrationRequest = catchAsync(async (req, res) => {
    const result = await managementAccountRegistrationService.createRegistrationRequest(req.body);
    sendSuccessResponse(res, {
      message: 'Request created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  getRegistrationRequests = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['email']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await managementAccountRegistrationService.getRegistrationRequests(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Registration request retrieved  successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });
  getRegistrationRequest = catchAsync(async (req, res) => {
    const result = await managementAccountRegistrationService.getRegistrationRequestById(
      req.params.id
    );
    sendSuccessResponse(res, {
      message: 'Registration request retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  cancelRegistrationRequest = catchAsync(async (req, res) => {
    const result = await managementAccountRegistrationService.cancelRegistrationRequest(
      req.user,
      req.params.id
    );
    sendSuccessResponse(res, {
      message: 'Registration request canceled  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  rejectRegistrationRequest = catchAsync(async (req, res) => {
    const result = await managementAccountRegistrationService.rejectRegistrationRequest(
      req.user,
      req.params.id
    );
    sendSuccessResponse(res, {
      message: 'Registration request rejected  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new ManagementAccountRegistrationRequestController();
