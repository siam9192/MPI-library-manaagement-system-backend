import { Router } from 'express';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';
import waitlistController from './waitlist.controller';
import validateRequest from '../../middlewares/validateRequest';
import waitlistValidation from './waitlist.validation';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(waitlistValidation.addItemToWaitlist),
  waitlistController.addToWaitlist
);

router.get('/my', auth(EUserRole.STUDENT), waitlistController.getMyWaitlistItemsFromDB);

router.delete('/:id', auth(EUserRole.STUDENT), waitlistController.removeItemFromWaitlist);

const waitlistRouter = router;

export default waitlistRouter;
