import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import managementAccountRegistrationRequestValidation from './management-account-registration-request.validation';
import managementAccountRegistrationRequestController from './management-account-registration-request.controller';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import auth from '../../middlewares/auth';

const router = Router();

router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  validateRequest(managementAccountRegistrationRequestValidation.createRegistrationRequest),
  managementAccountRegistrationRequestController.createRegistrationRequest
);

router.get(
  '/',
  auth(...MANAGEMENT_ROLES),
  managementAccountRegistrationRequestController.getRegistrationRequests
);

router.get(
  '/:id',
  auth(...MANAGEMENT_ROLES),
  managementAccountRegistrationRequestController.getRegistrationRequests
);

router.patch(
  '/:id/cancel',
  auth(...MANAGEMENT_ROLES),
  managementAccountRegistrationRequestController.cancelRegistrationRequest
);

router.patch(
  '/:id/reject',
  managementAccountRegistrationRequestController.rejectRegistrationRequest
);

const managementAccountRegistrationRequestRouter = router;

export default managementAccountRegistrationRequestRouter;
