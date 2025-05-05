import { z } from 'zod';

const CreateBorrowRequestValidation = z.object({
  bookId: z
    .string({ required_error: 'Book id is required!' })
    .nonempty({ message: 'Book id cannot be empty!' }),
  borrowForDays: z
    .number({ required_error: 'Borrow duration is required!' })
    .int({ message: 'Borrow days must be an integer!' })
    .min(1, { message: 'You must borrow for at least 1 day!' }),
});

const ApproveBorrowRequestValidation = z.object({
  expireDate: z.date({ coerce: true, required_error: 'Expire date is required!' }).refine(
    (date) => {
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      return date > minDate;
    },
    { message: 'Expire date must be at least 24 hours from now!' }
  ),
});

const RejectBorrowRequestValidation = z.object({
  rejectFor: z
    .string({ required_error: 'rejectedFor is required' })
    .nonempty('Rejected for can not be empty'),
});

const BorrowRequestValidations = {
  CreateBorrowRequestValidation,
  ApproveBorrowRequestValidation,
  RejectBorrowRequestValidation,
};

export default BorrowRequestValidations;
