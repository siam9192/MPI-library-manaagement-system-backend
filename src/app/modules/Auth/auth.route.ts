import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import AuthValidations from './auth.validation';
import AuthControllers from './auth.controller';

const router = Router();

const AuthRouter = router;

router.post(
  '/student-registration-request',
  validateRequest(AuthValidations.CreateStudentAccountRequestValidation),
  AuthControllers.createStudentRegistrationRequest
);

router.post(
  '/student-registration-request/resend-verification-otp/:token',
  AuthControllers.resendStudentRegistrationEmailVerificationOTP
);

router.post(
  '/student-registration-request/verify',
  validateRequest(AuthValidations.VerifyStudentRegistrationRequestUsingOTPValidation),
  AuthControllers.verifyStudentRegistrationRequestUsingOTP
);

router.post(
  '/student-login',
  validateRequest(AuthValidations.StudentLoginValidation),
  AuthControllers.studentLogin
);

router.post(
  '/management-login',
  validateRequest(AuthValidations.ManagementLoginValidation),
  AuthControllers.managementLogin
);

router.post(
  '/change-password',
  validateRequest(AuthValidations.ChangePasswordValidation),
  AuthControllers.changePassword
);

router.get('/access-token', AuthControllers.getNewAccessToken);

export default AuthRouter;
