import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import managementAccountRegistrationRequestValidation from './management-account-registration-request.validation';
import managementAccountRegistrationRequestController from './management-account-registration-request.controller';
import { managementRoles } from '../../utils/constant';
import auth from '../../middlewares/auth';

const router = Router();

router.post(
  '/',
   auth(...managementRoles),
  validateRequest(managementAccountRegistrationRequestValidation.createRegistrationRequest),
  managementAccountRegistrationRequestController.createRegistrationRequest
);

router.get('/', auth(...managementRoles), managementAccountRegistrationRequestController.getRegistrationRequests);

router.get('/:id', auth(...managementRoles), managementAccountRegistrationRequestController.getRegistrationRequests);

router.patch(
  '/:id/cancel',
   auth(...managementRoles),
  managementAccountRegistrationRequestController.cancelRegistrationRequest
);

router.patch(
  '/:id/reject',
  managementAccountRegistrationRequestController.rejectRegistrationRequest
);

const managementAccountRegistrationRequestRouter = router;

export default managementAccountRegistrationRequestRouter;
