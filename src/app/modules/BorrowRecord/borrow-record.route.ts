import { Router } from 'express';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
import borrowRecordController from './borrow-record.controller';
import { EUserRole } from '../../type';

const router = Router();

router.post('/process', auth(...managementRoles), borrowRecordController.processBorrowRecord);
router.get('/', borrowRecordController.getBorrowRecords);
router.get('/my', auth(EUserRole.STUDENT), borrowRecordController.getMyBorrowRecords);
router.get('/:id', borrowRecordController.getBorrowRecordById);
router.get('/my/:id', auth(EUserRole.STUDENT), borrowRecordController.getMyBorrowRecordById);

const borrowRecordRouter = router;
export default borrowRecordRouter;
