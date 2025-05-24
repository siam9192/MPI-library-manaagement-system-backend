import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import genreValidation from './genre.validation';
import genreController from './genre.controller';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import auth from '../../middlewares/auth';

const router = Router();
router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  validateRequest(genreValidation.createGenre),
  genreController.createGenre
);

router.put(
  '/:id',
  auth(...MANAGEMENT_ROLES),
  validateRequest(genreValidation.updateGenre),
  genreController.updateGenre
);

router.patch(
  '/:id/status',
  auth(...MANAGEMENT_ROLES),
  validateRequest(genreValidation.changeGenreStatus),
  genreController.changeGenreStatus
);

router.delete('/:id', auth(...MANAGEMENT_ROLES), genreController.softDeleteGenre);
router.get('/public', genreController.getPublicGenres);
router.get('/public/:id', genreController.getPublicGenreById);

// This secure routes must be always below of public routes
router.get('/', auth(...MANAGEMENT_ROLES), genreController.getGenres);
router.get('/:id', auth(...MANAGEMENT_ROLES), genreController.getGenreById);

const genreRouter = router;

export default genreRouter;
