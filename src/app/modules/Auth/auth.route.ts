import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import authValidation from './auth.validation';
import authController from './auth.controller';

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

router.post(
  '/student-login',
  validateRequest(authValidation.StudentLoginValidation),
  authController.studentLogin
);

// router.post(
//   '/management-login',
//   validateRequest(AuthValidations.ManagementLoginValidation),
//   AuthControllers.managementLogin
// );

router.post(
  '/change-password',
  validateRequest(authValidation.ChangePasswordValidation),
  authController.changePassword
);

router.get('/access-token',authController.getNewAccessToken);

export default authRouter;
