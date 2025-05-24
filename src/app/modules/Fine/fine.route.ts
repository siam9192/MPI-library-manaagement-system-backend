import { Router } from 'express';
import fineController from './fine.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.get('/', auth(...MANAGEMENT_ROLES), fineController.getFines);
router.get('/my', auth(EUserRole.STUDENT), fineController.getMyFines);

router.get('/:id', auth(...MANAGEMENT_ROLES), fineController.getFineById);
router.get(
  '/my/:id',
  auth(EUserRole.STUDENT),
  checkPermission('canBorrowBook'),
  fineController.getMyFineById
);

router.patch('/:id/wave', auth(...MANAGEMENT_ROLES), fineController.waveFine);
router.patch('/:id/pay', auth(...MANAGEMENT_ROLES), fineController.payFine);
const fineRouter = router;

export default fineRouter;
