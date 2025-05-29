import { Router } from 'express';
import studentRegistrationController from './student-registration-controller';
import validateRequest from '../../middlewares/validateRequest';
import studentRegistrationRequestValidation from './student-registration-request.validation';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.get(
  '/',
  auth(EUserRole.SUPER_ADMIN,EUserRole.ADMIN),
  studentRegistrationController.getAllStudentRegistrationRequest
);

router.patch(
  '/:id/approve',
  auth(EUserRole.SUPER_ADMIN,EUserRole.ADMIN),
  studentRegistrationController.approveRequest
);

router.patch(
  '/:id/reject',
  auth(EUserRole.SUPER_ADMIN,EUserRole.ADMIN),
  validateRequest(studentRegistrationRequestValidation.reject),
  studentRegistrationController.rejectRequest
);

const studentRegistrationRequestRouter = router;

export default studentRegistrationRequestRouter;
