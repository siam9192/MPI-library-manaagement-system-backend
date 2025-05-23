import { EUiTheme, ISystemSetting } from '../modules/SystemSetting/system-setting.interface';
import { EAdministratorRole, EUserRole } from '../modules/User/user.interface';

export const PAGINATION_OPTION_KEYS = ['page', 'limit', 'sortBy', 'sortOrder'];

export const MANAGEMENT_ROLES = [EUserRole.SUPER_ADMIN, EUserRole.ADMIN, EUserRole.LIBRARIAN];
export const ADMINISTRATOR_ROLES = Object.values(EAdministratorRole);
export const ALL_ROLES = Object.values(EUserRole) as EUserRole[];

export const DEFAULT_SYSTEM_SETTING = {
  general: {
    name: 'MPI Library',
    logo: 'https://example.com/logo.png',
    isSystemOnline: true,
    timezone: 'UTC',
    defaultLanguage: 'en',
    supportEmail: 'support@example.com',
    contactPhone: '+1234567890',
    organizationUrl: 'https://example.com',
  },
  borrowingPolicy: {
    minReputationRequired: 3,
    maxBorrowDays: 14,
    maxBorrowItems: 2,
    lateFeePerDay: 5,
    allowRenewals: true,
    maxRenewals: 2,
    allowBorrowHistoryView: true,
    requireApprovalBeforeBorrowing: false,
    reputationLoss: {
      onLate: 1,
      onDamage: 1.5,
      onLost: 3,
      onLate_Damage: 3.5,
      onLate_Lost: 4,
    },
    reputationGain: {
      returnOnTime_NormalCondition: 2,
    },
  },
  reservationPolicy: {
    borrowRequestExpiryDays: 2,
    reservationExpiryDays: 3,
    maxActiveReservations: 3,
    allowWaitlisting: true,
    reputationLoss: {
      onExpire: 5,
      onCancel: 3,
    },
    reputationGain: {
      onCheckout: 2,
    },
  },
  finePolicy: {
    fineExpiryDays: 7,
    reputationLossOnUnpaidFine: 2,
    reputationGainOnFinePayment: 2,
  },
  registrationPolicy: {
    studentRequestExpiryDays: 5,
    managementRequestExpiryDays: 7,
    requireEmailVerification: true,
    autoApproveStudents: false,
    enableStudentRegistration: true,
  },
  security: {
    emailVerificationExpiryMinutes: 30,
    enableTwoFactorAuth: true,
    sessionTimeoutMinutes: 15,
    ipWhitelist: ['192.168.1.1', '10.0.0.5'],
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true,
    },
  },
  notifications: {
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    overdueReminderDays: 2,
    notifyBeforeExpiryDays: 1,
    dailySummaryEnabled: true,
  },
  maintenance: {
    enabled: false,
    message: 'System under maintenance. Please check back later.',
    startTime: new Date('2025-05-25T02:00:00Z'),
    endTime: new Date('2025-05-25T04:00:00Z'),
    showCountdown: true,
  },
  uiCustomization: {
    defaultTheme: EUiTheme.LIGHT,
    enableThemeSwitch: true,
    itemsPerPage: 10,
  },
  audit: {
    enableAuditLogs: true,
    logRetentionDays: 90,
    trackUserActions: true,
  },
  isActive: true,
  isUpdatable: true,
};

export const GLOBAL_ERROR_MESSAGE =
  'Oops! There is something happened wrong.Please try again later';
