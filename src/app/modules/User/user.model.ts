import { model, Schema } from 'mongoose';
import { EUserRole, EUserStatus, IUser } from './user.interface';

const UserModelSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      minlength: 3,
      maxlength: 100,
      required: true,
      unique: true,
    },

    roll: {
      type: Number,
      min: 1000,
      default: null,
      unique: true,
    },
    password: {
      type: String,
      select: 0,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(EUserRole),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EUserStatus),
      default: EUserStatus.ACTIVE,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>('User', UserModelSchema);

export default User;
