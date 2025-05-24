import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import authorValidation from './author.validation';
import authorController from './author.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import checkPermission from '../../middlewares/checkPermission';

const router = Router();
router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  checkPermission(''),
  validateRequest(authorValidation.createAuthor),
  authorController.createAuthor
);

router.put('/:id', validateRequest(authorValidation.updateAuthor), authorController.updateAuthor);

router.patch(
  '/:id/status',
  validateRequest(authorValidation.changeAuthorStatus),
  authorController.updateAuthor
);

router.delete('/:id', authorController.softDeleteAuthor);

router.get('/', authorController.getAuthors);
router.get('/:id', authorController.getAuthorById);

router.get('/public/', authorController.getPublicAuthors);
router.get('/public/:id', authorController.getPublicAuthorById);

const authorRouter = router;

export default authorRouter;
