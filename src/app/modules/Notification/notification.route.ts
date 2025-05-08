import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import notificationValidation from './notification.validation';
import notificationController from './notification.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from '../../type';

const router = Router();

router.post(
  '/',
  validateRequest(notificationValidation.createNotification),
  notificationController.createNotification
);

router.get('/', notificationController.getNotifications);
router.get('/my', auth(...Object.values(EUserRole)), notificationController.getMyNotifications);
router.patch(
  '/set-as-read',
  auth(...Object.values(EUserRole)),
  notificationController.setMyNotificationsAsRead
);

const notificationRouter = router;

export default notificationRouter;
