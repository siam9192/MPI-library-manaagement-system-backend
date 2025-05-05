import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import authService from './auth.service';
import AuthService from './auth.service';

class AuthController {
  createStudentRegistrationRequest = catchAsync(async (req, res) => {
    const result = await AuthService.createStudentRegistrationRequestIntoDB(req.body);
    sendSuccessResponse(res, {
      message: '6 Digit OTP has been sent to your email',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });
  resendEmailVerificationOTP = catchAsync(async (req, res) => {
    const result = await AuthService.resendEmailVerificationOTP(req.params.token);
    sendSuccessResponse(res, {
      message: 'OTP has been resent successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  verifyStudentRegistrationRequestUsingOTP = catchAsync(async (req, res) => {
    const result = await AuthService.verifyStudentRegistrationRequestUsingOTP(req.body);
    sendSuccessResponse(res, {
      message: 'Email verification successfully!.Your has been created successfully ',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
   
  
studentLogin = catchAsync(async (req, res) => {
  const result = await authService.studentLogin(req.body);
  sendSuccessResponse(res, {
    message: 'Login successful',
    statusCode: httpStatus.OK,
    data: result,
  });
});

  changePassword = catchAsync(async (req, res) => {
  const result = await authService.changePassword;
  sendSuccessResponse(res, {
    message: 'Password has been changed successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
 });

  getNewAccessToken = catchAsync(async (req, res) => {
  const result = await authService.getNewAccessToken(req.body);
  sendSuccessResponse(res, {
    message: 'New access token retrieved successfully',
    statusCode: httpStatus.OK,
    data: result,
  });
});
}

export default new AuthController();
