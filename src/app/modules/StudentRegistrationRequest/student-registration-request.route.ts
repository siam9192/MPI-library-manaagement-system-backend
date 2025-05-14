import { Router } from 'express';
import studentRegistrationController from './student-registration-controller';
import validateRequest from '../../middlewares/validateRequest';
import studentRegistrationRequestValidation from './student-registration-request.validation';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';

const router = Router();

router.get(
  '/',
  auth(...managementRoles),
  studentRegistrationController.getAllStudentRegistrationRequest
);

router.patch(
  '/:id/approve',
  auth(...managementRoles),
  studentRegistrationController.approveRequest
);

router.patch(
  '/:id/reject',
  auth(...managementRoles),
  validateRequest(studentRegistrationRequestValidation.reject),
  studentRegistrationController.rejectRequest
);

const studentRegistrationRequestRouter = router;

export default studentRegistrationRequestRouter;
