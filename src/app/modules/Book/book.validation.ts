import { z } from 'zod';
import { EBookStatus } from './book.interface';

const CreateBookValidation = z.object({
  name: z.string().trim().nonempty({ message: 'Book name is required.' }),

  coverPhotoUrl: z.string().url({ message: 'Cover photo URL must be a valid URL.' }),

  genre: z.string().nonempty({ message: 'Genre ID is required.' }),

  author: z.string().nonempty({ message: 'Author ID is required.' }),

  shelfLocation: z
    .string()
    .min(3, { message: 'Shelf location must be at least 3 characters long.' })
    .max(20, { message: 'Shelf location must not exceed 20 characters.' }),
  availableCopies: z
    .number({ invalid_type_error: 'Available copies must be a number.' })
    .nonnegative({ message: 'Available copies cannot be negative.' }),
  status: z.nativeEnum(EBookStatus).optional(),
});

const UpdateBookValidation = CreateBookValidation.partial();

const BookValidations = {
  CreateBookValidation,
  UpdateBookValidation,
};

export default BookValidations;
