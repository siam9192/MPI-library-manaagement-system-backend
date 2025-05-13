import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import bookValidation from './book.validation';
import bookController from './book.controller';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();

router.post('/',auth(...managementRoles), 
checkPermission("book.canView","book.canAdd"),
validateRequest(bookValidation.createBook), bookController.createBook);
router.put('/:id',auth(...managementRoles),checkPermission("book.canView","book.canEdit"), validateRequest(bookValidation.updateBook), bookController.updateBook);
router.patch(
  '/:id/status',
  auth(...managementRoles),
  checkPermission("book.canView","book.canEdit"),
  validateRequest(bookValidation.changeBookStatus),
  bookController.changeBookStatus
);
router.delete('/:id',auth(...managementRoles),checkPermission("book.canView","book.canDelete"), bookController.softDeleteBook);
router.get('/',auth(...managementRoles),checkPermission("book.canView"), bookController.getBooks);
router.get('/:id',auth(...managementRoles),checkPermission("book.canView"), bookController.getBooks);

router.get('/public', bookController.getPublicBooks);
router.get('/public/:id', bookController.getPublicBookById);

const bookRouter = router;

export default bookRouter;
