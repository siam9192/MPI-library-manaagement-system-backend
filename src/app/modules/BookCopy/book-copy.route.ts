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
  auth(...managementRoles),checkPermission("book.canAdd"),
  validateRequest(bookCopyValidation.createBookCopy),
  bookCopyController.createBookCopy
);

router.put(
  '/:id',
   auth(...managementRoles),checkPermission("book.canEdit"),
  validateRequest(bookCopyValidation.updateBookCopy),
  bookCopyController.updateBookCopy
);

router.delete('/:id', auth(...managementRoles),checkPermission("book.canDelete"), bookCopyController.deleteBookCopy);

router.get('/book/:bookId', auth(...managementRoles),checkPermission("book.canView"), bookCopyController.getBookCopies);

const bookCopyRouter = router;

export default bookCopyRouter;
