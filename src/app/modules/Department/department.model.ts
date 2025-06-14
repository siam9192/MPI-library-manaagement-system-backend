import { model, Schema, Types } from 'mongoose';
import { EDepartmentStatus, IDepartment } from './department.interface';

const DepartmentModelSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 50,
      required: true,
    },
    shortName: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 10,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EDepartmentStatus),
      default: EDepartmentStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

const Department = model<IDepartment>('Department', DepartmentModelSchema);
export default Department;
