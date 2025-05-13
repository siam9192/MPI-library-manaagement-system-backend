import { Router } from 'express';
import fineController from './fine.controller';
import { EUserRole } from '../../type';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

router.get('/', fineController.getFines);
router.get('/my', auth(EUserRole.STUDENT), fineController.getMyFines);

router.get('/:id', fineController.getFineById);
router.get(
  '/my/:id',
  auth(EUserRole.STUDENT),
  checkPermission('canBorrowBook'),
  fineController.getMyFineById
);

router.patch('/:id/wave', auth(...managementRoles), fineController.waveFine);
router.patch('/:id/pay', auth(...managementRoles), fineController.payFine);
const fineRouter = router;

export default fineRouter;
