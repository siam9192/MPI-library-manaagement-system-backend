import { Router } from 'express';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';
import holdBorrowRequestController from './hold-borrow-request.controller';
import validateRequest from '../../middlewares/validateRequest';
import holdBorrowRequestValidation from './hold-borrow-request.validation';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(holdBorrowRequestValidation.createHoldBorrowRequest),
  holdBorrowRequestController.createHoldBorrowRequest
);

router.get(
  '/my',
  auth(EUserRole.STUDENT),
  holdBorrowRequestController.getMyHoldBorrowRequestsFromDB
);

router.delete(
  '/:id',
  auth(EUserRole.STUDENT),
  holdBorrowRequestController.deleteHoldBorrowRequestFromDB
);

const holdBorrowRequestRouter = router;

export default holdBorrowRequestRouter;
