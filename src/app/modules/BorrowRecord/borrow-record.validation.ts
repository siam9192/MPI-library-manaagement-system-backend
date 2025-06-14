import { z } from 'zod';
import { EBorrowReturnCondition } from './borrow-record.interface';

const processBorrow = z
  .object({
    bookCondition: z.nativeEnum(EBorrowReturnCondition, {
      message: 'Invalid bookCondition status',
    }),
    makeAvailable: z.boolean({ required_error: 'Make available is required' }),
    fineAmount: z.number().int().optional(),
    isFineReceived: z.boolean({
      required_error: 'isFineReceived status is required',
    }),
  })
  .refine(
    (data) => {
      if (data.bookCondition !== EBorrowReturnCondition.NORMAL) {
        return data.fineAmount && data.fineAmount > 0;
      }
      return true;
    },
    {
      message:
        'Fine amount is required when book condition is not NORMAL. Fine condition must be getter then 0',
      path: ['fineAmount'], // This helps target the specific field for the error
    }
  );

export default {
  processBorrow,
};
