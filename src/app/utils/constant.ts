import { EUiTheme } from '../modules/SystemSetting/system-setting.interface';
import { EAdministratorRole, EUserRole } from '../modules/User/user.interface';

export const paginationOptionKeys = ['page', 'limit', 'sortBy', 'sortOrder'];

export const managementRoles = [EUserRole.SUPER_ADMIN, EUserRole.ADMIN, EUserRole.LIBRARIAN];
export const administratorRoles = Object.values(EAdministratorRole);
export const allRoles = Object.values(EUserRole) as EUserRole[];



export const defaultSystemSetting = {
  general: {
    name: "MPI Library",
    logo: "https://example.com/logo.png",
    isSystemOnline: true,
    timezone: "UTC",
    defaultLanguage: "en",
    supportEmail: "support@example.com",
    contactPhone: "+1234567890",
    organizationUrl: "https://example.com"
  },
  borrowingPolicy: {
    maxBorrowDays: 14,
    maxBorrowItems: 2,
    lateFeePerDay: 5,
    allowRenewals: true,
    maxRenewals: 2,
    allowBorrowHistoryView: true,
    requireApprovalBeforeBorrowing: false
  },
  reservationPolicy: {
    borrowRequestExpiryDays: 2,
    reservationExpiryDays: 3,
    maxActiveReservations: 3,
    allowWaitlisting: true,
    reputationLoss: {
      onExpire: 5,
      onCancel: 3
    },
    reputationIncrease: {
      onCheckout: 2
    }
  },
  registrationPolicy: {
    studentRequestExpiryDays: 5,
    managementRequestExpiryDays: 7,
    requireEmailVerification: true,
    autoApproveStudents: false,
    enableStudentRegistration: true
  },
  security: {
    emailVerificationExpiryMinutes: 30,
    enableTwoFactorAuth: true,
    sessionTimeoutMinutes: 15,
    ipWhitelist: ["192.168.1.1", "10.0.0.5"],
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true
    }
  },
  notifications: {
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    overdueReminderDays: 2,
    notifyBeforeExpiryDays: 1,
    dailySummaryEnabled: true
  },
  maintenance: {
    enabled: false,
    message: "System under maintenance. Please check back later.",
    startTime: new Date("2025-05-25T02:00:00Z"),
    endTime: new Date("2025-05-25T04:00:00Z"),
    showCountdown: true
  },
  uiCustomization: {
    defaultTheme: EUiTheme.LIGHT, 
    enableThemeSwitch: true,
    itemsPerPage: 10
  },
  audit: {
    enableAuditLogs: true,
    logRetentionDays: 90,
    trackUserActions: true
  },
  isActive: true,
  isUpdatable: true
};

