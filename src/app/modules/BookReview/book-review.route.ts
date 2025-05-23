import { Router } from 'express';
import auth from '../../middlewares/auth';
import bookReviewController from './book-review.controller';
import validateRequest from '../../middlewares/validateRequest';
import bookReviewValidation from './book-review.validation';
import { MANAGEMENT_ROLES } from '../../utils/constant';
import { EUserRole } from '../User/user.interface';

const router = Router();

router.post(
  '/',
  auth(EUserRole.STUDENT),
  validateRequest(bookReviewValidation.createBookReview),
  bookReviewController.createBookReview
);

router.patch('/:id/status', auth(...MANAGEMENT_ROLES), bookReviewController.changeBookReviewStatus);

router.delete('/:id', auth(EUserRole.STUDENT), bookReviewController.softDeleteBookReview);

router.get('/', auth(...MANAGEMENT_ROLES), bookReviewController.getBookReviews);

router.get('/public/book/:bookId', bookReviewController.getPublicBookReviewsByBookId);

router.get('/public/:id', bookReviewController.getPublicBookReviewById);

const bookReviewRouter = router;

export default bookReviewRouter;
