import { IModelNecessaryFields } from '../../types/model.type';

export interface ISystemSetting extends IModelNecessaryFields {
  general: {
    name: string;
    logo: string;
    isSystemOnline: boolean;
    timezone: string;
    defaultLanguage: string;
    supportEmail: string;
    contactPhone?: string;
    organizationUrl?: string;
  };
  borrowingPolicy: {
    minReputationRequired: number;
    maxBorrowDays: number;
    maxBorrowItems: number;
    lateFeePerDay: number;
    allowRenewals: boolean;
    maxRenewals: number;
    allowBorrowHistoryView: boolean;
    requireApprovalBeforeBorrowing: boolean;
  };

  reservationPolicy: {
    borrowRequestExpiryDays: number;
    reservationExpiryDays: number;
    maxActiveReservations: number;
    allowWaitlisting: boolean;
    reputationLoss: {
      onExpire: number;
      onCancel: number;
    };
    reputationIncrease: {
      onCheckout: number;
    };
  };
  registrationPolicy: {
    studentRequestExpiryDays: number;
    managementRequestExpiryDays: number;
    requireEmailVerification: boolean;
    autoApproveStudents: boolean;
    enableStudentRegistration: boolean;
  };
  security: {
    emailVerificationExpiryMinutes: number;
    enableTwoFactorAuth: boolean;
    sessionTimeoutMinutes: number;
    ipWhitelist?: string[];
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
    };
  };

  notifications: {
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    overdueReminderDays: number;
    notifyBeforeExpiryDays: number;
    dailySummaryEnabled: boolean;
  };

  maintenance: {
    enabled: boolean;
    message?: string;
    startTime?: Date; // ISO timestamp
    endTime?: Date; // ISO timestamp
    showCountdown?: boolean;
  };

  uiCustomization: {
    defaultTheme: EUiTheme;
    enableThemeSwitch: boolean;
    itemsPerPage: number;
  };
  audit: {
    enableAuditLogs: boolean;
    logRetentionDays: number;
    trackUserActions: boolean;
  };
  isActive: boolean;
  isUpdatable: boolean;
}

export interface IUpdateSystemSettingPayload {
  maxBorrowDays?: number;
  maxBorrowItems?: number;
  lateFeePerDay?: number;
  borrowRequestExpiryDays: number;
  reservationExpiryDays?: number;
  studentRegistrationRequestExpiryDays?: number;
  managementRegistrationRequestExpiryDays?: number;
  emailVerificationExpiryMinutes?: number;
}

export enum EUiTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
