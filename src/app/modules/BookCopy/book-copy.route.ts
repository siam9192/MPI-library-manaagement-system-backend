import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import bookCopyValidation from './book-copy.validation';
import bookCopyController from './book-copy.controller';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

router.post(
  '/',
  auth(...managementRoles),
  validateRequest(bookCopyValidation.createBookCopy),
  bookCopyController.createBookCopy
);

router.put(
  '/:id',
   auth(...managementRoles),
  validateRequest(bookCopyValidation.updateBookCopy),
  bookCopyController.updateBookCopy
);

router.delete('/:id', auth(...managementRoles), bookCopyController.deleteBookCopy);

router.get('/book/:bookId', auth(...managementRoles),bookCopyController.getBookCopies);

const bookCopyRouter = router;

export default bookCopyRouter;
