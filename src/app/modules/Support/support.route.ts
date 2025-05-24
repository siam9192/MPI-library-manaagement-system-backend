import { Router } from 'express';
import { ADMINISTRATOR_ROLES } from '../../utils/constant';
import auth from '../../middlewares/auth';
import supportController from './support.controller';
import { EUserRole } from '../User/user.interface';
import validateRequest from '../../middlewares/validateRequest';
import supportValidation from './support.validation';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(supportValidation.createSupport),
  supportController.createSupportIntoDB
);

router.patch(
  '/:id/resolve',
  auth(...ADMINISTRATOR_ROLES),
  validateRequest(supportValidation.resolveSupport),
  supportController.resolveSupport
);

router.patch('/:id/failed', auth(...ADMINISTRATOR_ROLES), supportController.setSupportAsFailed);

const supportRouter = router;

export default supportRouter;
