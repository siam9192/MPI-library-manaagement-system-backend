import mongoose, { Schema } from 'mongoose';
import { ISystemSetting } from './system-setting.interface';

const SystemSettingModelSchema = new Schema<ISystemSetting>(
  {
    general: {
      name: { type: String, required: true },
      logo: { type: String, required: true },
      isSystemOnline: { type: Boolean, default: true },
      timezone: { type: String, required: true },
      defaultLanguage: { type: String, required: true },
      supportEmail: { type: String, required: true },
      contactPhone: { type: String },
      organizationUrl: { type: String },
    },

    borrowingPolicy: {
      minReputationRequired: { type: Number, required: true },
      maxBorrowDays: { type: Number, required: true },
      maxBorrowItems: { type: Number, required: true },
      lateFeePerDay: { type: Number, required: true },
      allowRenewals: { type: Boolean, default: true },
      maxRenewals: { type: Number, default: 1 },
      allowBorrowHistoryView: { type: Boolean, default: true },
      requireApprovalBeforeBorrowing: { type: Boolean, default: false },
    },

    reservationPolicy: {
      borrowRequestExpiryDays: { type: Number, required: true },
      reservationExpiryDays: { type: Number, required: true },
      maxActiveReservations: { type: Number, required: true },
      allowWaitlisting: { type: Boolean, default: true },
      reputationLoss: {
        onExpire: { type: Number, default: 0 },
        onCancel: { type: Number, default: 0 },
      },
      reputationIncrease: {
        onCheckout: { type: Number, default: 0 },
      },
    },

    registrationPolicy: {
      studentRequestExpiryDays: { type: Number, required: true },
      managementRequestExpiryDays: { type: Number, required: true },
      requireEmailVerification: { type: Boolean, default: true },
      autoApproveStudents: { type: Boolean, default: false },
      enableStudentRegistration: { type: Boolean, default: true },
    },

    security: {
      emailVerificationExpiryMinutes: { type: Number, required: true },
      enableTwoFactorAuth: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 30 },
      ipWhitelist: [{ type: String }],
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireNumbers: { type: Boolean, default: true },
        requireSymbols: { type: Boolean, default: true },
        requireUppercase: { type: Boolean, default: true },
      },
    },

    notifications: {
      enableEmailNotifications: { type: Boolean, default: true },
      enableSMSNotifications: { type: Boolean, default: false },
      overdueReminderDays: { type: Number, default: 1 },
      notifyBeforeExpiryDays: { type: Number, default: 1 },
      dailySummaryEnabled: { type: Boolean, default: false },
    },

    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String },
      startTime: { type: Date },
      endTime: { type: Date },
      showCountdown: { type: Boolean, default: false },
    },

    uiCustomization: {
      defaultTheme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      enableThemeSwitch: { type: Boolean, default: true },
      itemsPerPage: { type: Number, default: 10 },
    },

    audit: {
      enableAuditLogs: { type: Boolean, default: true },
      logRetentionDays: { type: Number, default: 90 },
      trackUserActions: { type: Boolean, default: true },
    },

    isActive: { type: Boolean, default: true },
    isUpdatable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model('SystemSetting', SystemSettingModelSchema);

export default SystemSetting;
