import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import bookValidation from './book.validation';
import bookController from './book.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  validateRequest(bookValidation.createBook),
  bookController.createBook
);
router.put(
  '/:id',
  auth(...MANAGEMENT_ROLES),
  checkPermission('book.canView', 'book.canEdit'),
  validateRequest(bookValidation.updateBook),
  bookController.updateBook
);
router.patch(
  '/:id/status',
  auth(...MANAGEMENT_ROLES),
  validateRequest(bookValidation.changeBookStatus),
  bookController.changeBookStatus
);
router.delete('/:id', auth(...MANAGEMENT_ROLES), bookController.softDeleteBook);
router.get('/', auth(...MANAGEMENT_ROLES), bookController.getBooks);
router.get('/:id', auth(...MANAGEMENT_ROLES), bookController.getBooks);

router.get('/public', bookController.getPublicBooks);
router.get('/public/:id', bookController.getPublicBookById);

const bookRouter = router;

export default bookRouter;
