import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import managementAccountRegistrationRequestValidation from './management-account-registration-request.validation';
import managementAccountRegistrationRequestController from './management-account-registration-request.controller';

const router = Router();

router.post(
  '/',
  validateRequest(managementAccountRegistrationRequestValidation.createRegistrationRequest),
  managementAccountRegistrationRequestController.createRegistrationRequest
);

router.get('/', managementAccountRegistrationRequestController.getRegistrationRequests);

router.get('/:id', managementAccountRegistrationRequestController.getRegistrationRequests);

router.patch(
  '/:id/cancel',
  managementAccountRegistrationRequestController.cancelRegistrationRequest
);

router.patch(
  '/:id/reject',
  managementAccountRegistrationRequestController.rejectRegistrationRequest
);

const managementAccountRegistrationRequestRouter = router;

export default managementAccountRegistrationRequestRouter;
