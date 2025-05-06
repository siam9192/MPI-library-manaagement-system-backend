import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import studentRegistrationRequestService from './student-registration-request.service';

class StudentRegistrationController {
  getAllStudentRegistrationRequest = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);

    const result = await studentRegistrationRequestService.getAllStudentRegistrationRequestsFromDB(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Student registration requests retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  approveRequest = catchAsync(async (req, res) => {
    const result = await studentRegistrationRequestService.approveRequestIntoDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'Registration request approved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  rejectRequest = catchAsync(async (req, res) => {
    const result = await studentRegistrationRequestService.rejectRequestIntoDB(
      req.params.id,
      req.body
    );
    sendSuccessResponse(res, {
      message: 'Registration request rejected successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new StudentRegistrationController();
