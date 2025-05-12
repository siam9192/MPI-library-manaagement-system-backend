import {
  TAdminPermissions,
  TLibrarianPermissions,
  TStudentPermissions,
  TSuperPermissions,
} from './role-permission.interface';

export const StudentDefaultPermissions: TStudentPermissions = {
  canBorrowBook: true,
  canRequestWaiveFine: false,
  canEditProfile: true,
  canChangePassword: true,
  canUseSupport: true,
  canConfigureBasicSettings: true,
  canReceiveNotifications: true,
  isEditable: true,
};

export const LibrarianDefaultPermissions: TLibrarianPermissions = {
  book: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
  },
  borrowRequest: {
    canView: true,
    canApprove: true,
    canReject: true,
    canOverrideDueDate: false,
  },
  reservation: {
    canView: true,
    canProcess: true,
  },
  fine: {
    canView: true,
    canReceive: true,
    canWaive: true,
    canAdjust: true,
  },
  student: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  report: {
    canGenerateBasic: true,
    canGenerateAdvanced: true,
  },
  system: {
    canReceiveNotifications: true,
    canChangePassword: true,
    canUpdateProfile: true,
    canConfigureBasicSettings: true,
    canConfigureCriticalSettings: true,
  },
  notification: {
    student: {
      canView: false,
      canEdit: false,
      canDelete: false,
      canSend: true,
    },
  },
  isEditable: true,
};

export const AdminDefaultPermissions: TAdminPermissions = {
  book: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
  },
  borrowRequest: {
    canView: true,
    canApprove: true,
    canReject: true,
    canOverrideDueDate: false,
  },
  reservation: {
    canView: true,
    canProcess: true,
  },
  fine: {
    canView: true,
    canReceive: true,
    canWaive: true,
    canAdjust: true,
  },
  student: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  librarian: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  report: {
    canGenerateBasic: true,
    canGenerateAdvanced: true,
  },
  system: {
    canReceiveNotifications: true,
    canChangePassword: true,
    canUpdateProfile: true,
    canConfigureBasicSettings: true,
    canConfigureCriticalSettings: true,
  },
  notification: {
    student: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canSend: true,
    },
    librarian: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canSend: true,
    },
  },
  isEditable: true,
};

export const SuperAdminDefaultPermissions: TSuperPermissions = {
  book: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
  },
  borrowRequest: {
    canView: true,
    canApprove: true,
    canReject: true,
    canOverrideDueDate: false,
  },
  reservation: {
    canView: true,
    canProcess: true,
  },
  fine: {
    canView: true,
    canReceive: true,
    canWaive: true,
    canAdjust: true,
  },
  student: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  librarian: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  admin: {
    canView: true,
    canDelete: true,
    canEdit: true,
    canEditPermissions: true,
  },
  report: {
    canGenerateBasic: true,
    canGenerateAdvanced: true,
  },
  system: {
    canReceiveNotifications: true,
    canChangePassword: true,
    canUpdateProfile: true,
    canConfigureBasicSettings: true,
    canConfigureCriticalSettings: true,
  },
  notification: {
    student: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canSend: true,
    },
    librarian: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canSend: true,
    },
    admin: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canSend: true,
    },
  },
  isEditable: false,
};
