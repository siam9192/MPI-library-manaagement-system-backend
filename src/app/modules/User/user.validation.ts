import { z } from 'zod';
import { EGender } from '../../types/model.type';

// TAddress schema
export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  district: z.string(),
  country: z.string(),
});

// TUserAddress schema
export const UserAddressSchema = z.object({
  present: AddressSchema,
  permanent: AddressSchema.optional(),
  currentIsPresent: z.boolean().optional(),
});

const updateStudentProfile = z
  .object({
    fullName: z
      .string()
      .min(3, { message: 'Full name must be at least 3 characters long' })
      .max(30, { message: 'Full name must be at most 30 characters long' }),
    gender: z.nativeEnum(EGender),
    profilePhotoUrl: z.string().url('Invalid url'),
    address: UserAddressSchema,
  })
  .partial();

const updateLibrarianProfile = z
  .object({
    fullName: z
      .string()
      .min(3, { message: 'Full name must be at least 3 characters long' })
      .max(30, { message: 'Full name must be at most 30 characters long' }),

    profilePhotoUrl: z
      .string({ required_error: 'Profile photo URL is required' })
      .url({ message: 'Profile photo must be a valid URL' }),

    gender: z.nativeEnum(EGender, {
      errorMap: () => ({ message: 'Gender must be one of the defined values' }),
    }),
    about: z
      .string({
        required_error: 'About is required',
        invalid_type_error: 'About must be string type',
      })
      .min(20, 'About must be in 20 and maximum 1000 characters')
      .max(1000),
    contactInfo: z.object({
      emailAddress: z
        .string({ required_error: 'Email address is required' })
        .email({ message: 'Invalid email address format' }),

      phoneNumber: z
        .string()
        .min(5, { message: 'Phone number must be at least 5 digits' })
        .max(11, { message: 'Phone number must be at most 11 digits' }),
    }),
  })
  .partial();

const updateAdministratorProfile = z
  .object({
    fullName: z
      .string()
      .min(3, { message: 'Full name must be at least 3 characters long' })
      .max(30, { message: 'Full name must be at most 30 characters long' }),

    profilePhotoUrl: z
      .string({ required_error: 'Profile photo URL is required' })
      .url({ message: 'Profile photo must be a valid URL' }),

    gender: z.nativeEnum(EGender, {
      errorMap: () => ({ message: 'Gender must be one of the defined values' }),
    }),

    contactInfo: z.object({
      emailAddress: z
        .string({ required_error: 'Email address is required' })
        .email({ message: 'Invalid email address format' }),

      phoneNumber: z
        .string()
        .min(5, { message: 'Phone number must be at least 5 digits' })
        .max(11, { message: 'Phone number must be at most 11 digits' }),
    }),
  })
  .partial();

export default {
  updateStudentProfile,
  updateLibrarianProfile,
  updateAdministratorProfile,
};
