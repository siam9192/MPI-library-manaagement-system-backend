import { TPermission } from '../../types';

export interface IRolePermission extends Document {
  role: 'superadmin' | 'admin' | 'librarian';
  permissions: {
    books: TPermission;
    users: TPermission;
    librarians: TPermission;
    admins: TPermission;
    settings: TPermission;
    reports: TPermission;
  };
  isChangeable: boolean;
}
