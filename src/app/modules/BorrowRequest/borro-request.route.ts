import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import borrowRequestValidation from './borrow-request.validation';
import borrowRequestController from './borrow-request.controller';
import { EUserRole } from '../User/user.interface';
import { MANAGEMENT_ROLES } from '../../utils/constant';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(borrowRequestValidation.createBorrowRequest),
  borrowRequestController.createBorrowRequest
);

router.patch(
  '/:id/approve',
  auth(...MANAGEMENT_ROLES),
  borrowRequestController.approveBorrowRequest
);

router.patch(
  '/:id/reject',
  auth(...MANAGEMENT_ROLES),
  validateRequest(borrowRequestValidation.rejectBorrowRequest),
  borrowRequestController.rejectBorrowBorrowRequest
);

router.get('/', auth(...MANAGEMENT_ROLES), borrowRequestController.getBorrowRequests);
router.get('/my', auth(EUserRole.STUDENT), borrowRequestController.getMyBorrowRequests);

router.get('/:id', auth(...MANAGEMENT_ROLES), borrowRequestController.getBorrowRequestById);

router.get('/my/id', auth(EUserRole.STUDENT), borrowRequestController.getMyBorrowRequestById);

const borrowRequestRouter = router;

export default borrowRequestRouter;
