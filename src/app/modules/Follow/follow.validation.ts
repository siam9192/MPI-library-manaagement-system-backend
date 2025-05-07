import { z } from 'zod';

const createFollow = z.object({
  authorId: z.string({ required_error: 'Author id is required' }),
});

export default {
  createFollow,
};
