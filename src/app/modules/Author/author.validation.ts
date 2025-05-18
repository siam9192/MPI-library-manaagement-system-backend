import { z } from 'zod';
import { EAuthorStatus } from './author.interface';

const createAuthor = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Invalid type string is required',
    })
    .nonempty()
    .max(50),
  photoUrl: z.string().url('Invalid url').optional(),
  biography: z
    .string()
    .min(10, 'Biography must be at least 10 character')
    .max(5000, 'Biography must be in 10 - 5000 character'),
});

const updateAuthor = createAuthor.partial();

const changeAuthorStatus = z.object({
  status: z.enum([EAuthorStatus.ACTIVE, EAuthorStatus.INACTIVE], { message: 'Invalid status' }),
});

export default {
  createAuthor,
  updateAuthor,
  changeAuthorStatus,
};
