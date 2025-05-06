import { z } from 'zod';

const reject = z.object({
  rejectReason: z.string().nonempty('Reject reason is required'),
});

export default {
  reject,
};
