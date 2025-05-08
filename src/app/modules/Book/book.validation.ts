import { z } from 'zod';

import { EBookCopyCondition } from '../BookCopy/book-copy.interface';
import { Types } from 'mongoose';

const createBook = z.object({
  name: z.string().trim().nonempty({ message: 'Book name is required.' }),

  coverPhotoUrl: z.string().url({ message: 'Cover photo URL must be valid.' }),

  genreId: z
    .string()
    .nonempty({ message: 'Genre is required.' })
    .refine((val) => Types.ObjectId.isValid(val), {
      message: 'Invalid genreId.',
    }),

  authorId: z
    .string()
    .nonempty({ message: 'Author is required.' })
    .refine((val) => Types.ObjectId.isValid(val), {
      message: 'Invalid authorId.',
    }),

  copies: z
    .array(
      z.object({
        shelfLocation: z
          .string({ required_error: 'Shelf location is required.' })
          .nonempty('Shelf location is required.')
          .min(1, 'Shelf location must be at least 1 character.')
          .max(30, 'Shelf location must be at most 30 characters.'),
        condition: z.nativeEnum(EBookCopyCondition, {
          message: `Invalid condition. Must be one of: ${Object.values(EBookCopyCondition).join(', ')}.`,
        }),
      })
    )
    .min(1, 'At least 1 book copy is required'),
});

const updateBook = z
  .object({
    name: z.string().trim().nonempty({ message: 'Book name is required.' }),
    coverPhotoUrl: z.string().url({ message: 'Cover photo URL must be valid.' }),
    genre: z
      .string()
      .nonempty({ message: 'Genre is required.' })
      .refine((val) => Types.ObjectId.isValid(val), {
        message: 'Invalid genreId.',
      }),
    author: z
      .string()
      .nonempty({ message: 'Author is required.' })
      .refine((val) => Types.ObjectId.isValid(val), {
        message: 'Invalid authorId.',
      }),
  })
  .partial();

export default {
  createBook,
  updateBook,
};
