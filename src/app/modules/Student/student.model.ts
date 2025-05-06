import { Schema, model, Types } from 'mongoose';
import { IStudent, EShift } from './student.interface'; // Adjust the path as needed
import { EGender } from '../../types/model.type';
import { UserAddressSchema } from '../../schemas';

const StudentModelSchema = new Schema<IStudent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      minlength: 3,
      maxlength: 30,
      required: true,
      trim: true,
    },
    roll: {
      type: Number,
      unique: true,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(EGender),
      required: true,
    },
    profilePhotoUrl: {
      type: String,
      default: null,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    currentSemester: {
      type: Number,
      min: 1,
      max: 8,
      required: true,
    },
    shift: {
      type: String,
      enum: Object.values(EShift),
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    address: {
      type: UserAddressSchema,
      default: {
        present: null,
        permanent: null,
        currentIsPresent: false,
      },
    },
    reputationIndex: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    _id: true,
  }
);

export const Student = model<IStudent>('Student', StudentModelSchema);
