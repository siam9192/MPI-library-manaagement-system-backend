import { z } from 'zod';
import { isValidObjectId } from '../../helpers';
import { EBookReviewStatus } from './book-review.interface';

const createBookReview = z.object({
  borrowId: z
    .string({ required_error: 'borrowId is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid borrowId' }),
  rating: z.number().min(1, 'ratting must be in 1-5').max(5, 'ratting must be in 1-5'),
  content: z.string().nonempty('content can not be empty').optional(),
});

const changeBookReviewStatus = z.object({
  status: z.enum([EBookReviewStatus.VISIBLE, EBookReviewStatus.HIDDEN], {
    message: 'Invalid status',
  }),
});

export default {
  createBookReview,
  changeBookReviewStatus,
};
