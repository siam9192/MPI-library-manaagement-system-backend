import { model, Schema } from 'mongoose';
import { EUserRole, EUserStatus, IUser } from './user.interface';
import rolePermissionService from '../RolePermission/role-permission.service';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';

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
    permissions: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>('User', UserModelSchema);
UserModelSchema.pre('save', async function (next) {
  try {
    const user = this as IUser;
    const role = user.role as EUserRole;

    const rolePermissions = await rolePermissionService.getRolePermissionsFromDB(role);
    const permissions = rolePermissions?.permissions;

    if (!permissions) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Permissions not found for role');
    }

    user.permissions = permissions as any; // assign directly if types match

    next();
  } catch (error:any) {
    next(error);
  }
});


export default User;
