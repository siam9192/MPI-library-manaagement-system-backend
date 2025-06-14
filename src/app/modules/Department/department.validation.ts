import { z } from 'zod';
import { EDepartmentStatus } from './department.interface';

const createDepartment = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Invalid type! String is required',
    })
    .trim()
    .nonempty('Name cannot be empty')
    .min(1, 'Name must be at least 1 character')
    .max(50, 'Name must be at most 50 characters'),
  shortName: z
    .string()
    .trim()
    .min(1, 'Short name must be at least 1 character')
    .max(10, 'Short name must be at most 10 characters')
    .transform((val) => val.toUpperCase()),
});

const updateDepartment = z
  .object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Invalid type! String is required',
      })
      .trim()
      .nonempty('Name cannot be empty')
      .min(1, 'Name must be at least 1 character')
      .max(30, 'Name must be at most 30 characters'),
    shortName: z
      .string()
      .trim()
      .min(1, 'Short name must be at least 1 character')
      .max(10, 'Short name must be at most 10 characters')
      .transform((val) => val.toUpperCase()),
    status: z.nativeEnum(EDepartmentStatus, {
      invalid_type_error: `Invalid status! status must be in ${Object.values(EDepartmentStatus).join(',')} `,
    }),
  })
  .partial();

export default {
  createDepartment,
  updateDepartment,
};
