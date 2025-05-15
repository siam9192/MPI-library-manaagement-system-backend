import { Router } from 'express';
import reservationController from './reservation.controller';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.get('/', auth(...managementRoles), reservationController.getReservations);
router.get('/my', auth(...managementRoles), reservationController.getMyReservations);
router.get('/:id', auth(...managementRoles), reservationController.getReservationById);
router.get('/my/:id', auth(EUserRole.STUDENT), reservationController.getMyReservationById);

router.patch('/:id/cancel', auth(EUserRole.STUDENT), reservationController.cancelReservation);
router.post('/:id/checkout', auth(...managementRoles), reservationController.checkoutReservation);

router.get('/:id/qr', reservationController.getReservationQrCode);
const reservationRouter = router;

export default reservationRouter;
