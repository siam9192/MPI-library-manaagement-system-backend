import { z } from 'zod';
import { isValidObjectId } from '../../helpers';

const addItemToWaitlist = z.object({
  bookId: z
    .string({ required_error: 'bookId is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid bookId' }),
  borrowForDays: z.number({ required_error: 'borrowForDays is required' }).min(1),
});

export default {
  addItemToWaitlist
};
