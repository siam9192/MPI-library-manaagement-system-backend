import { z } from 'zod';

const createSupport = z.object({
  subject: z
    .string({ required_error: 'subject is required' })
    .nonempty()
    .max(100, 'subject  must be in 100 characters'),
  message: z
    .string({ required_error: 'message is required' })
    .nonempty()
    .max(1000, 'message must be in 1000 characters'),
});

const resolveSupport = z.object({
  resolutionNote: z
    .string({ required_error: 'message is required' })
    .nonempty()
    .max(1000, 'message must be in 1000 characters'),
  sendMail: z.boolean({ required_error: 'sendMail is required' }),
});

export default {
  createSupport,
  resolveSupport,
};
