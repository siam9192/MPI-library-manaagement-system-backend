import { Schema } from 'mongoose';
import { TContactInfo } from '../types/model.type';

const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
); // No separate _id for subdocument

export const UserAddressSchema = new Schema({
  present: { type: AddressSchema, required: true },
  permanent: { type: AddressSchema, default: null },
  presentIsPermanent: { type: Boolean, default: false },
});

export const ContactInfoSchema = new Schema<TContactInfo>({
  emailAddress: {
    type: String,
    minLength: 3,
    maxLength: 100,
    required: true,
  },
  phoneNumber: {
    type: String,
    minLength: 3,
    maxLength: 11,
    required: true,
  },
});
