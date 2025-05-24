import { Router } from 'express';
import studentRegistrationController from './student-registration-controller';
import validateRequest from '../../middlewares/validateRequest';
import studentRegistrationRequestValidation from './student-registration-request.validation';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';

const router = Router();

router.get(
  '/',
  auth(...MANAGEMENT_ROLES),
  studentRegistrationController.getAllStudentRegistrationRequest
);

router.patch(
  '/:id/approve',
  auth(...MANAGEMENT_ROLES),
  studentRegistrationController.approveRequest
);

router.patch(
  '/:id/reject',
  auth(...MANAGEMENT_ROLES),
  validateRequest(studentRegistrationRequestValidation.reject),
  studentRegistrationController.rejectRequest
);

const studentRegistrationRequestRouter = router;

export default studentRegistrationRequestRouter;
