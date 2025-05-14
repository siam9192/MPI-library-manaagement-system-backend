import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import borrowRequestValidation from './borrow-request.validation';
import borrowRequestController from './borrow-request.controller';
import { EUserRole } from '../User/user.interface';
import { managementRoles } from '../../utils/constant';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(borrowRequestValidation.createBorrowRequest),
  borrowRequestController.createBorrowRequest
);

router.patch(
  '/:id/approve',
   auth(...managementRoles),
  validateRequest(borrowRequestValidation.approveBorrowRequest),
  borrowRequestController.approveBorrowRequest
);

router.patch(
  '/:id/reject',
   auth(...managementRoles),
  validateRequest(borrowRequestValidation.rejectBorrowRequest),
  borrowRequestController.rejectBorrowBorrowRequest
);

router.get('/', auth(...managementRoles), borrowRequestController.getBorrowRequests);
router.get('/my', auth(EUserRole.STUDENT), borrowRequestController.getMyBorrowRequests);

router.get('/:id', auth(...managementRoles), borrowRequestController.getBorrowRequestById);

router.get('/my/id',auth(EUserRole.STUDENT),borrowRequestController.getMyBorrowRequestById);

const borrowRequestRouter = router;

export default borrowRequestRouter;
