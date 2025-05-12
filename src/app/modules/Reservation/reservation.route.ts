import { Router } from 'express';
import reservationController from './reservation.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from '../../type';
import { managementRoles } from '../../utils/constant';

const router = Router();

router.get('/', reservationController.getReservations);
router.get('/my', auth(EUserRole.STUDENT), reservationController.getMyReservations);
router.get('/:id', reservationController.getReservationById);
router.get('/my/:id', auth(EUserRole.STUDENT), reservationController.getMyReservationById);

router.patch('/:id/cancel', auth(EUserRole.STUDENT), reservationController.cancelReservation);
router.post('/:id/checkout', auth(...managementRoles), reservationController.checkoutReservation);

const reservationRouter = router;

export default reservationRouter;
