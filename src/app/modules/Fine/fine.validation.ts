import { z } from 'zod';
import { EFineStatus } from './fine.interface';

const changeFineStatus = z.object({
  status: z.nativeEnum(EFineStatus, { message: 'Invalid fine status' }),
});

export default {
  changeFineStatus,
};
