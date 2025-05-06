import { Router } from 'express';
import studentRegistrationController from './student-registration-controller';
import validateRequest from '../../middlewares/validateRequest';
import studentRegistrationRequestValidation from './student-registration-request.validation';

const router = Router();

router.get('/', studentRegistrationController.getAllStudentRegistrationRequest);

router.patch('/:id/approve', studentRegistrationController.approveRequest);

router.patch(
  '/:id/reject',
  validateRequest(studentRegistrationRequestValidation.reject),
  studentRegistrationController.rejectRequest
);

const studentRegistrationRequestRouter = router;

export default studentRegistrationRequestRouter;
