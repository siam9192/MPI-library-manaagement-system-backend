
type TStudentPermission = {
  canBorrowBook: boolean;
  canRequestWaveFine: boolean;
  canEditProfile: boolean;
  canChangePassword: boolean;
  canUseSupport: boolean;
  canConfigureBasicSettings: boolean; 
};


type TLibrarianPermissions = {
  // Book Management
  canViewBooks:boolean
  canAddBooks:boolean,
  canEditBooks:boolean
  canDeleteBooks:boolean
  // Circulation
  canApproveBorrowRequest: boolean; // Borrow requests
  canRejectBorrowRequest: boolean; // Book returns
  canOverrideDueDate: boolean; // Special cases

  // Reservations
  canProcessReservations:boolean

  // Fines
  canViewFines: boolean; // Read-only access
  canReceivedFines: boolean; // Record payments
  canWaiveFines: boolean; // Forgive fines
  canAdjustFines: boolean;

  // User Management
  canViewStudents: boolean; // Read student info
  canDeleteStudents: boolean; // Update student records
  canEditStudents:boolean
  canEditStudentPermissions: boolean; 
  

  // Notifications
  canViewStudentNotifications:boolean
  canEditStudentNotification:boolean
  canDeleteStudentNotifications:boolean
  canSendStudentNotification:boolean
  canReceiveNotifications:boolean

  // Reports
  canGenerateBasicReports: boolean;
  canGenerateAdvancedReports: boolean;

  // System
  canChangePassword:boolean
  canUpdateProfile: boolean; // Own profile only
  canConfigureBasicSettings: boolean; // Non-critical settings
 
};

type TAdminPermissions = {
   // Book Management
  canViewBooks:boolean
  canAddBooks:boolean,
  canEditBooks:boolean
  canDeleteBooks:boolean
  // Circulation
  canApproveBorrowRequest: boolean; // Borrow requests
  canRejectBorrowRequest: boolean; // Book returns
  canOverrideDueDate: boolean; // Special cases

  // Reservations
  canProcessReservations:boolean

  // Fines
  canViewFines: boolean; // Read-only access
  canReceivedFines: boolean; // Record payments
  canWaiveFines: boolean; // Forgive fines
  canAdjustFines: boolean;

  // User Management
  canViewStudents: boolean; // Read student info
  canDeleteStudents: boolean; // Update student records
  canEditStudents:boolean
  canEditStudentPermissions: boolean; 
  
  canViewLibrarians:boolean;
  canDeleteLibrarians:boolean;
  canEditLibrarians:boolean
  canEditLibrarianPermissions: boolean; 
  


  canViewStudentNotifications:boolean
  canEditStudentNotification:boolean
  canDeleteStudentNotifications:boolean
  canSendStudentNotification:boolean

  canViewLibrarianNotifications:boolean
  canEditLibrarianNotification:boolean
  canDeleteLibrarianNotifications:boolean
  canSendLibrarianNotification:boolean

  canReceiveNotifications:boolean
  

  // Reports
  canGenerateBasicReports: boolean;
  canGenerateAdvancedReports: boolean;

  // System
  canChangePassword:boolean
  canUpdateProfile: boolean; // Own profile only
  canConfigureBasicSettings: boolean; // Non-critical settings
  
};


type TSuperPermissions = {
   // Book Management
  canViewBooks:true
  canAddBooks:true,
  canEditBooks:true
  canDeleteBooks:true
  // Circulation
  canApproveBorrowRequest: true; // Borrow requests
  canRejectBorrowRequest: true; // Book returns
  canOverrideDueDate: true; // Special cases

  // Reservations
  canProcessReservations:true

  // Fines
  canViewFines: true; // Read-only access
  canReceivedFines: true; // Record payments
  canWaiveFines: true; // Forgive fines
  canAdjustFines: true;

  // User Management
  canViewStudents: true; // Read student info
  canDeleteStudents: true; // Update student records
  canEditStudents:true
  canEditStudentPermissions: true; 

  canViewLibrarians:true;
  canDeleteLibrarians:true;
  canEditLibrarians:true
  canEditLibrarianPermissions: true; 

  canViewAdmins:true;
  canDeleteAdmins:true;
  canEditAdmins:true
  canAdminLibrarianPermissions: true; 
  
  // Notifications
  canViewStudentNotifications:true
  canEditStudentNotification:true
  canDeleteStudentNotifications:true
  canSendStudentNotification:true

  canViewLibrarianNotifications:true
  canEditLibrarianNotification:true
  canDeleteLibrarianNotifications:true
  canSendLibrarianNotification:true
  
  canViewAdminNotifications:true
  canEditAdminNotification:true
  canDeleteAdminNotifications:true
  canSendAdminNotification:true
  
  canReceiveNotifications:true

  
  // Reports
  canGenerateBasicReports: true;
  canGenerateAdvancedReports: true;

  // System
  canChangePassword:true
  canUpdateProfile: true; // Own profile only
  canConfigureBasicSettings: true; // Non-critical settings
  canConfigureCriticalSettings: boolean; 
  isEditable:false
};
