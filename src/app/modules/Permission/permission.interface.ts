interface IPermission {}
type TStudentPermission = {
  canBorrow: boolean;
  canAccessLibrary: boolean;
  canAccessOnlineCourses: boolean;
  canSubmitAssignments: boolean;
  canViewGrades: boolean;
  canJoinEvents: boolean;
};

type TLibrarianPermissions = {
  // Book Management
  canManageBooks: boolean; // Create/update/delete books

  // Circulation
  canProcessBorrowRequests: boolean; // Borrow requests
  canProcessReturns: boolean; // Book returns
  canProcessRenewals: boolean; // Loan extensions
  canOverrideDueDates: boolean; // Special cases

  // Reservations
  canManageReservations: boolean; // Create/update/cancel

  // Fines
  canViewFines: boolean; // Read-only access
  canProcessFines: boolean; // Record payments
  canWaiveFines: boolean; // Forgive fines
  canAdjustFines: boolean;

  // User Management
  canViewStudents: boolean; // Read student info
  canManageStudents: boolean; // Update student records

  // Reports
  canGenerateBasicReports: boolean;
  canGenerateAdvancedReports: boolean;

  // System
  canUpdateProfile: boolean; // Own profile only
  canConfigureBasicSettings: boolean; // Non-critical settings
};

type TAdminPermissions = {};
