import { model, Schema } from 'mongoose';
import { EUserRole } from '../User/user.interface';
import { IRolePermission } from './role-permission.interface';

const PermissionSchema: Schema = new Schema(
  {
    read: { type: Boolean, required: true },
    write: { type: Boolean, required: true },
    delete: { type: Boolean, required: true },
  },
  { _id: false }
);

const RolePermissionSchema: Schema = new Schema(
  {
    role: {
      type: String,
      enum: [EUserRole.SUPER_ADMIN, EUserRole.ADMIN, EUserRole.LIBRARIAN],
      required: true,
      unique: true,
    },
    permissions: {
      books: { type: PermissionSchema, required: true },
      users: { type: PermissionSchema, required: true },
      librarians: { type: PermissionSchema, required: true },
      admins: { type: PermissionSchema, required: true },
      settings: { type: PermissionSchema, required: true },
      reports: { type: PermissionSchema, required: true },
    },
    isChangeable: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const RolePermission = model<IRolePermission>('RolePermission', RolePermissionSchema);
