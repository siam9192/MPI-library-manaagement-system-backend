import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import bookCopyValidation from './book-copy.validation';
import bookCopyController from './book-copy.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  validateRequest(bookCopyValidation.createBookCopy),
  bookCopyController.createBookCopy
);

router.put(
  '/:id',
  auth(...MANAGEMENT_ROLES),
  validateRequest(bookCopyValidation.updateBookCopy),
  bookCopyController.updateBookCopy
);

router.delete('/:id', auth(...MANAGEMENT_ROLES), bookCopyController.deleteBookCopy);

router.get('/book/:bookId', auth(...MANAGEMENT_ROLES), bookCopyController.getBookCopies);

const bookCopyRouter = router;

export default bookCopyRouter;
