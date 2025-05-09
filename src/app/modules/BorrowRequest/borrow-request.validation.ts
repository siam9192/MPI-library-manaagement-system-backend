import { z } from 'zod';
import { isValidObjectId } from '../../helpers';

const createBorrowRequest = z.object({
  bookId: z
    .string({ required_error: 'Book id is required!' })
    .nonempty({ message: 'Book id cannot be empty!' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid bookId' }),
  borrowForDays: z
    .number({ required_error: 'Borrow duration is required!' })
    .int({ message: 'Borrow days must be an integer!' })
    .min(1, { message: 'You must borrow for at least 1 day!' }),
});

const approveBorrowRequest = z.object({
  copyId: z
    .string({ required_error: 'Copy id is required' })
    .refine((val) => isValidObjectId(val), { message: 'Invalid copyId' }),
});

const rejectBorrowRequest = z.object({
  rejectReason: z
    .string({ required_error: 'rejectedFor is required' })
    .nonempty('Rejected for can not be empty'),
});

export default {
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
};
