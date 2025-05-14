import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import genreValidation from './genre.validation';
import genreController from './genre.controller';
import { managementRoles } from '../../utils/constant';
import auth from '../../middlewares/auth';

const router = Router();
router.post(
  '/',
  auth(...managementRoles),
  validateRequest(genreValidation.createGenre),
  genreController.createGenre
);

router.put(
  '/:id',
  auth(...managementRoles),
  validateRequest(genreValidation.updateGenre),
  genreController.updateGenre
);

router.patch(
  '/:id/status',
  auth(...managementRoles),
  validateRequest(genreValidation.changeGenreStatus),
  genreController.changeGenreStatus
);

router.delete('/:id', auth(...managementRoles), genreController.softDeleteGenre);
router.get('/public', genreController.getPublicGenres);
router.get('/public/:id', genreController.getPublicGenreById);

// This secure routes must be always below of public routes
router.get('/', auth(...managementRoles), genreController.getGenres);
router.get('/:id', auth(...managementRoles), genreController.getGenreById);

const genreRouter = router;

export default genreRouter;
