import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import genreValidation from './genre.validation';
import genreController from './genre.controller';


const router = Router();
router.post('/', validateRequest(genreValidation.createGenre), genreController.createGenre);

router.put('/:id', validateRequest(genreValidation.updateGenre), genreController.updateGenre);

router.patch(
  '/:id/status',
  validateRequest(genreValidation.changeGenreStatus),
  genreController.changeGenreStatus
);




router.delete('/:id', genreController.softDeleteGenre);
router.get('/public', genreController.getPublicGenres);
router.get('/public/:id', genreController.getPublicGenreById);



// This secure routes must be always below of public routes
router.get('/', genreController.getGenres);
router.get('/:id', genreController.getGenreById);



const genreRouter = router;

export default genreRouter;
