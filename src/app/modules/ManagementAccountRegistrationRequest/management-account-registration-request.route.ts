import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import managementAccountRegistrationRequestValidation from './management-account-registration-request.validation';
import managementAccountRegistrationRequestController from './management-account-registration-request.controller';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.post(
  '/',
  auth(EUserRole.SUPER_ADMIN, EUserRole.ADMIN),
  validateRequest(managementAccountRegistrationRequestValidation.createRegistrationRequest),
  managementAccountRegistrationRequestController.createRegistrationRequest
);

router.get(
  '/',
  auth(EUserRole.SUPER_ADMIN, EUserRole.ADMIN),
  managementAccountRegistrationRequestController.getRegistrationRequests
);

router.get(
  '/:id',
  auth(EUserRole.SUPER_ADMIN, EUserRole.ADMIN),
  managementAccountRegistrationRequestController.getRegistrationRequests
);

router.patch(
  '/:id/cancel',
  auth(EUserRole.SUPER_ADMIN, EUserRole.ADMIN),
  managementAccountRegistrationRequestController.cancelRegistrationRequest
);

router.patch(
  '/:id/reject',
  auth(EUserRole.SUPER_ADMIN, EUserRole.ADMIN),
  managementAccountRegistrationRequestController.rejectRegistrationRequest
);

const managementAccountRegistrationRequestRouter = router;

export default managementAccountRegistrationRequestRouter;
