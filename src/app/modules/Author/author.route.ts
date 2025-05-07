import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import authorValidation from './author.validation';
import authorController from './author.controller';

const router = Router();
router.post('/', validateRequest(authorValidation.createAuthor), authorController.createAuthor);

router.put('/:id', validateRequest(authorValidation.updateAuthor), authorController.updateAuthor);

router.patch(
  '/:id/status',
  validateRequest(authorValidation.changeAuthorStatus),
  authorController.updateAuthor
);

router.delete('/:id', authorController.softDeleteAuthor);

router.get('management/', authorController.getAuthors);
router.get('management/:id', authorController.getAuthorById);

router.get('/', authorController.getPublicAuthors);
router.get('/:id', authorController.getPublicAuthorById);

const authorRouter = router;

export default authorRouter;
