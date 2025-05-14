import { Router } from 'express';
import { administratorRoles } from '../../utils/constant';
import auth from '../../middlewares/auth';
import supportController from './support.controller';
import { EUserRole } from '../User/user.interface';
import validateRequest from '../../middlewares/validateRequest';
import supportValidation from './support.validation';

const router = Router();

router.post('/',auth(EUserRole.STUDENT),validateRequest(supportValidation.createSupport),supportController.createSupportIntoDB);


router.patch('/:id/resolve',auth(...administratorRoles),validateRequest(supportValidation.resolveSupport),supportController.resolveSupport);

router.patch('/:id/failed',auth(...administratorRoles),supportController.setSupportAsFailed)


const supportRouter = router;


export default supportRouter