import { Router } from 'express';
import reservationController from './reservation.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.get('/', auth(...MANAGEMENT_ROLES), reservationController.getReservations);
router.get('/my', auth(...MANAGEMENT_ROLES), reservationController.getMyReservations);
router.get('/:id', auth(...MANAGEMENT_ROLES), reservationController.getReservationById);
router.get('/my/:id', auth(EUserRole.STUDENT), reservationController.getMyReservationById);

router.patch('/:id/cancel', auth(EUserRole.STUDENT), reservationController.cancelReservation);
router.post('/:id/checkout', auth(...MANAGEMENT_ROLES), reservationController.checkoutReservation);

router.get('/:id/ticket', reservationController.getReservationQrCode);
const reservationRouter = router;

export default reservationRouter;
