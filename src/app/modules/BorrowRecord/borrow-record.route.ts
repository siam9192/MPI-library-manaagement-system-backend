import { Router } from 'express';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import borrowRecordController from './borrow-record.controller';
import validateRequest from '../../middlewares/validateRequest';
import borrowRecordValidation from './borrow-record.validation';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.post(
  '/:id/process',
  validateRequest(borrowRecordValidation.processBorrow),
  auth(...MANAGEMENT_ROLES),
  borrowRecordController.processBorrowRecord
);
router.get('/', auth(...MANAGEMENT_ROLES), borrowRecordController.getBorrowRecords);
router.get('/my', auth(EUserRole.STUDENT), borrowRecordController.getMyBorrowRecords);
router.get('/my/not-reviewed', borrowRecordController.getMyNotReviewedBorrowRecords);
router.get('/:id', auth(...MANAGEMENT_ROLES), borrowRecordController.getBorrowRecordById);
router.get('/my/:id', auth(EUserRole.STUDENT), borrowRecordController.getMyBorrowRecordById);

const borrowRecordRouter = router;
export default borrowRecordRouter;
