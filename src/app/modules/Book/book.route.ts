import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import bookValidation from './book.validation';
import bookController from './book.controller';

const router = Router();

router.post('/', validateRequest(bookValidation.createBook), bookController.createBook);
router.put('/',validateRequest(bookValidation.updateBook),bookController.updateBook)
router.patch('/:id/status',bookController.changeBookStatus)
router.get('/',bookController.getBooks)
router.get('/:id',bookController.getBooks)
router.get('/public',bookController.getPublicBooks)
router.get('/public/:id',bookController.getPublicBookById)
const bookRouter = router;

export default bookRouter;
