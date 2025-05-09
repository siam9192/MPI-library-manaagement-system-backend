import { Router } from 'express';
import auth from '../../middlewares/auth';
import { EUserRole } from '../../type';
import validateRequest from '../../middlewares/validateRequest';
import borrowRequestValidation from './borrow-request.validation';
import borrowRequestController from './borrow-request.controller';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(borrowRequestValidation.createBorrowRequest),
  borrowRequestController.createBorrowRequest
);

router.patch(
  '/:id/approve',
  auth(EUserRole.LIBRARIAN),
  validateRequest(borrowRequestValidation.approveBorrowRequest),
  borrowRequestController.approveBorrowRequest
);

router.patch(
  '/:id/reject',
  auth(EUserRole.LIBRARIAN),
  validateRequest(borrowRequestValidation.rejectBorrowRequest),
  borrowRequestController.rejectBorrowBorrowRequest
);

router.get('/', borrowRequestController.getBorrowRequests);
router.get('/my', auth(EUserRole.STUDENT), borrowRequestController.getMyBorrowRequests);

router.get('/:id', borrowRequestController.getBorrowRequestById);

router.get('/my/id', auth(EUserRole.STUDENT), borrowRequestController.getMyBorrowRequestById);

const borrowRequestRouter = router;

export default borrowRequestRouter;
