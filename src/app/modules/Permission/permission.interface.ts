// --- Base Permission Types ---
type TBookPermissions = {
  canViewBooks: boolean;
  canAddBooks: boolean;
  canEditBooks: boolean;
  canDeleteBo: boolean;
};

type TCirculationPermissions = {
  canApproveBorrowRequest: boolean;
  canRejectBorrowRequest: boolean;
  canOverrideDueDate: boolean;
};

type TReservationPermissions = {
  canViewReservations: boolean;
  canProcessReservations: boolean;
};

type TFinePermissions = {
  canViewFines: boolean;
  canReceiveFines: boolean;
  canWaiveFines: boolean;
  canAdjustFines: boolean;
};

type TNotificationPermissions = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
};

type TReportPermissions = {
  canGenerateBasicReports: boolean;
  canGenerateAdvancedReports: boolean;
};

type TSystemPermissions = {
  canChangePassword: boolean;
  canUpdateProfile: boolean;
  canConfigureBasicSettings: boolean;
  canConfigureCriticalSettings?: boolean; // Optional for non-super users
};

type TStudentManagementPermissions = {
  canViewStudents: boolean;
  canDeleteStudents: boolean;
  canEditStudents: boolean;
  canEditStudentPermissions: boolean;
};

type TLibrarianManagementPermissions = {
  canViewLibrarians: boolean;
  canDeleteLibrarians: boolean;
  canEditLibrarians: boolean;
  canEditLibrarianPermissions: boolean;
};

type TAdminManagementPermissions = {
  canViewAdmins: boolean;
  canDeleteAdmins: boolean;
  canEditAdmins: boolean;
  canEditAdminPermissions: boolean;
};

// --- Student Permissions ---
type TStudentPermission = {
  canBorrowBook: boolean;
  canRequestWaiveFine: boolean;
  canEditProfile: boolean;
  canChangePassword: boolean;
  canUseSupport: boolean;
  canConfigureBasicSettings: boolean;
  canReceiveNotifications: boolean;
};

// --- Librarian Permissions ---
type TLibrarianPermissions = TBookPermissions &
  TCirculationPermissions &
  TReservationPermissions &
  TFinePermissions &
  TStudentManagementPermissions &
  TReportPermissions &
  TSystemPermissions & {
    canReceiveNotifications: boolean;
    studentNotifications: TNotificationPermissions;
  };

// --- Admin Permissions ---
type TAdminPermissions = TBookPermissions &
  TCirculationPermissions &
  TReservationPermissions &
  TFinePermissions &
  TStudentManagementPermissions &
  TLibrarianManagementPermissions &
  TReportPermissions &
  TSystemPermissions & {
    canReceiveNotifications: boolean;
    studentNotifications: TNotificationPermissions;
    librarianNotifications: TNotificationPermissions;
  };

// --- Super Admin Permissions ---
type TSuperPermissions = TBookPermissions &
  TCirculationPermissions &
  TReservationPermissions &
  TFinePermissions &
  TStudentManagementPermissions &
  TLibrarianManagementPermissions &
  TAdminManagementPermissions &
  TReportPermissions &
  TSystemPermissions & {
    canReceiveNotifications: true;
    studentNotifications: TNotificationPermissions;
    librarianNotifications: TNotificationPermissions;
    adminNotifications: TNotificationPermissions;
    isEditable: false;
  };
