import { z } from 'zod';
import { EBookCopyCondition } from './book-copy.interface';
import { isValidObjectId } from 'mongoose';

const createBookCopy = z.object({
  bookId: z.string().refine((val) => isValidObjectId(val), { message: 'Invalid bookId' }),
  shelfLocation: z
    .string({ required_error: 'Shelf location is required.' })
    .nonempty('Shelf location is required.')
    .min(1, 'Shelf location must be at least 1 character.')
    .max(30, 'Shelf location must be at most 30 characters.'),
  condition: z.nativeEnum(EBookCopyCondition, {
    message: `Invalid condition. Must be one of: ${Object.values(EBookCopyCondition).join(', ')}.`,
  }),
});

const updateBookCopy = z
  .object({
    shelfLocation: z
      .string({ required_error: 'Shelf location is required.' })
      .nonempty('Shelf location is required.')
      .min(1, 'Shelf location must be at least 1 character.')
      .max(30, 'Shelf location must be at most 30 characters.'),
    condition: z.nativeEnum(EBookCopyCondition, {
      message: `Invalid condition. Must be one of: ${Object.values(EBookCopyCondition).join(', ')}.`,
    }),
  })
  .partial();

export default {
  createBookCopy,
  updateBookCopy,
};
