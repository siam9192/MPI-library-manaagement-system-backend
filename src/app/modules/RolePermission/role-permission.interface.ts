import { EUserRole } from '../../type';

// --- Base Permission Types ---
export type TBookPermissions = {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type TBorrowRequestPermissions = {
  canView: true;
  canApprove: boolean;
  canReject: boolean;
  canOverrideDueDate: boolean;
};

export type TReservationPermissions = {
  canView: boolean;
  canProcess: boolean;
};

export type TFinePermissions = {
  canView: boolean;
  canReceive: boolean;
  canWaive: boolean;
  canAdjust: boolean;
};

export type TNotificationPermissions = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
};

export type TReportPermissions = {
  canGenerateBasic: boolean;
  canGenerateAdvanced: boolean;
};

export type TSystemPermissions = {
  canReceiveNotifications: boolean;
  canChangePassword: boolean;
  canUpdateProfile: boolean;
  canConfigureBasicSettings: boolean;
  canConfigureCriticalSettings?: boolean; // Optional for non-super users
};

export type TStudentManagementPermissions = {
  canView: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canEditPermissions: boolean;
};

export type TLibrarianManagementPermissions = {
  canView: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canEditPermissions: boolean;
};

export type TAdminManagementPermissions = {
  canView: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canEditPermissions: boolean;
};

// --- Student Permissions ---
export type TStudentPermissions = {
  canBorrowBook: boolean;
  canRequestWaiveFine: boolean;
  canEditProfile: boolean;
  canChangePassword: boolean;
  canUseSupport: boolean;
  canConfigureBasicSettings: boolean;
  canReceiveNotifications: boolean;
  isEditable: boolean;
};

// --- Librarian Permissions ---
export type TLibrarianPermissions = {
  book: TBookPermissions;
  borrowRequest: TBorrowRequestPermissions;
  reservation: TReservationPermissions;
  fine: TFinePermissions;
  student: TStudentManagementPermissions;
  report: TReportPermissions;
  system: TSystemPermissions;
  notification: {
    student: TNotificationPermissions;
  };
  isEditable: boolean;
};

// --- Admin Permissions ---
export type TAdminPermissions = {
  book: TBookPermissions;
  borrowRequest: TBorrowRequestPermissions;
  reservation: TReservationPermissions;
  fine: TFinePermissions;
  student: TStudentManagementPermissions;
  librarian: TLibrarianManagementPermissions;
  report: TReportPermissions;
  system: TSystemPermissions;
  notification: {
    student: TNotificationPermissions;
    librarian: TNotificationPermissions;
  };
  isEditable: boolean;
};

// --- Super Admin Permissions ---
export type TSuperPermissions = {
  book: TBookPermissions;
  borrowRequest: TBorrowRequestPermissions;
  reservation: TReservationPermissions;
  fine: TFinePermissions;
  student: TStudentManagementPermissions;
  librarian: TLibrarianManagementPermissions;
  admin: TAdminManagementPermissions;
  report: TReportPermissions;
  system: TSystemPermissions;
  notification: {
    student: TNotificationPermissions;
    librarian: TNotificationPermissions;
    admin: TNotificationPermissions;
  };
  isEditable: false;
};

export interface IRolePermission {
  role: EUserRole;
  permissions: TSuperPermissions | TAdminPermissions | TLibrarianPermissions | TStudentPermissions;
}
