import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import authValidation from './auth.validation';
import authController from './auth.controller';
import { ALL_ROLES } from '../../utils/constant';
import auth from '../../middlewares/auth';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

const authRouter = router;

router.post(
  '/student-registration-request',
  validateRequest(authValidation.CreateStudentAccountRequestValidation),
  authController.createStudentRegistrationRequest
);

router.post(
  '/student-registration-request/resend-verification-otp/:token',
  authController.resendEmailVerificationOTP
);

router.post(
  '/student-registration-request/verify',
  validateRequest(authValidation.VerifyStudentRegistrationRequestUsingOTPValidation),
  authController.verifyStudentRegistrationRequestUsingOTP
);

router.post('/register-management-account/:token', authController.registerManagementAccount);

router.post(
  '/student-login',
  validateRequest(authValidation.StudentLoginValidation),
  authController.studentLogin
);

router.post(
  '/management-login',
  validateRequest(authValidation.ManagementLoginValidation),
  authController.managementLogin
);

router.post(
  '/change-password',
  auth(...ALL_ROLES),
  validateRequest(authValidation.ChangePasswordValidation),
  authController.changePassword
);

router.get('/access-token', authController.getNewAccessToken);

export default authRouter;
