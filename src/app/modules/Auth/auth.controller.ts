import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import AuthServices from './auth.service';

const createStudentRegistrationRequest = catchAsync(async (req, res) => {
  const result = await AuthServices.createStudentRegistrationRequestIntoDB(req.body);
  sendSuccessResponse(res, {
    message: '6 Digit OTP has been sent to your email',
    statusCode: httpStatus.CREATED,
    data: result,
  });
});

const resendStudentRegistrationEmailVerificationOTP = catchAsync(async (req, res) => {
  const result = await AuthServices.resendEmailVerificationOTP(req.params.token);
  sendSuccessResponse(res, {
    message: 'OTP has been resent successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const verifyStudentRegistrationRequestUsingOTP = catchAsync(async (req, res) => {
  const result = await AuthServices.verifyStudentRegistrationRequestUsingOTP(req.body);
  sendSuccessResponse(res, {
    message: 'Email successfully verified',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const studentLogin = catchAsync(async (req, res) => {
  const result = await AuthServices.studentLogin(req.body);
  sendSuccessResponse(res, {
    message: 'Login successful',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const managementLogin = catchAsync(async (req, res) => {
  const result = await AuthServices.managementLogin(req.body);
  sendSuccessResponse(res, {
    message: 'Login successful',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const result = await AuthServices.changePassword;
  sendSuccessResponse(res, {
    message: 'Password has been changed successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const getNewAccessToken = catchAsync(async (req, res) => {
  const result = await AuthServices.getNewAccessToken(req.body);
  sendSuccessResponse(res, {
    message: 'New access token retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});

const AuthControllers = {
  createStudentRegistrationRequest,
  resendStudentRegistrationEmailVerificationOTP,
  verifyStudentRegistrationRequestUsingOTP,
  studentLogin,
  managementLogin,
  changePassword,
  getNewAccessToken,
};

export default AuthControllers;
