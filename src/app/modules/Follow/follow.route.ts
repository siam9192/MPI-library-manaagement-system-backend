import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import followValidation from './follow.validation';
import FollowController from './Follow.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(followValidation.createFollow),
  FollowController.createFollow
);

router.delete('/:authorId', auth(EUserRole.STUDENT), FollowController.deleteFollow);
router.get('/status/:authorId', auth(EUserRole.STUDENT), FollowController.getFollowStatus);

router.get('/mine', auth(EUserRole.STUDENT), FollowController.getMineFollows);

router.get('/author/:authorId', FollowController.getAuthorFollowers);

const followRouter = router;

export default followRouter;
