import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import BookValidations from './book.validation';
import BookControllers from './book.controller';

const router = Router();

router.post('/', validateRequest(BookValidations.CreateBookValidation), BookControllers.createBook);

router.put(
  '/:id',
  validateRequest(BookValidations.UpdateBookValidation),
  BookControllers.updateBook
);

router.delete('/:id', BookControllers.deleteBook);

router.get('/', BookControllers.getBooks);

router.get('/manage', BookControllers.getBooksForManage);

router.get('/:id', BookControllers.getBook);

const BookRouter = router;

export default BookRouter;
