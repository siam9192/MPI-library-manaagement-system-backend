import mongoose, { Schema } from 'mongoose';
import { EUiTheme, ISystemSetting } from './system-setting.interface';

const SystemSettingModelSchema = new Schema(
  {
    general: {
      name: { type: String, required: true },
      logo: { type: String, required: true },
      isSystemOnline: { type: Boolean, required: true },
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
      allowRenewals: { type: Boolean, required: true },
      maxRenewals: { type: Number, required: true },
      allowBorrowHistoryView: { type: Boolean, required: true },
      requireApprovalBeforeBorrowing: { type: Boolean, required: true },
      reputationLoss: {
        onLate: { type: Number, required: true },
        onDamage: { type: Number, required: true },
        onLost: { type: Number, required: true },
        onLate_Damage: { type: Number, required: true },
        onLate_Lost: { type: Number, required: true },
      },
      reputationGain: {
        returnOnTime_NormalCondition: { type: Number, required: true },
      },
    },
    finePolicy: {
      fineExpiryDays: { type: Number, required: true },
      reputationLossOnUnpaidFine: { type: Number, required: true },
      reputationGainOnFinePayment: { type: Number, required: true },
    },
    reservationPolicy: {
      borrowRequestExpiryDays: { type: Number, required: true },
      reservationExpiryDays: { type: Number, required: true },
      maxActiveReservations: { type: Number, required: true },
      allowWaitlisting: { type: Boolean, required: true },
      reputationLoss: {
        onExpire: { type: Number, required: true },
        onCancel: { type: Number, required: true },
      },
      reputationGain: {
        onCheckout: { type: Number, required: true },
      },
    },
    registrationPolicy: {
      studentRequestExpiryDays: { type: Number, required: true },
      managementRequestExpiryDays: { type: Number, required: true },
      requireEmailVerification: { type: Boolean, required: true },
      autoApproveStudents: { type: Boolean, required: true },
      enableStudentRegistration: { type: Boolean, required: true },
    },
    security: {
      emailVerificationExpiryMinutes: { type: Number, required: true },
      enableTwoFactorAuth: { type: Boolean, required: true },
      sessionTimeoutMinutes: { type: Number, required: true },
      ipWhitelist: { type: [String], default: [] },
      passwordPolicy: {
        minLength: { type: Number, required: true },
        requireNumbers: { type: Boolean, required: true },
        requireSymbols: { type: Boolean, required: true },
        requireUppercase: { type: Boolean, required: true },
      },
    },
    notifications: {
      enableEmailNotifications: { type: Boolean, required: true },
      enableSMSNotifications: { type: Boolean, required: true },
      overdueReminderDays: { type: Number, required: true },
      notifyBeforeExpiryDays: { type: Number, required: true },
      dailySummaryEnabled: { type: Boolean, required: true },
    },
    maintenance: {
      enabled: { type: Boolean, required: true },
      message: { type: String },
      startTime: { type: Date },
      endTime: { type: Date },
      showCountdown: { type: Boolean },
    },
    uiCustomization: {
      defaultTheme: {
        type: String,
        enum: Object.values(EUiTheme), // adjust enum based on your EUiTheme
        required: true,
      },
      enableThemeSwitch: { type: Boolean, required: true },
      itemsPerPage: { type: Number, required: true },
    },
    audit: {
      enableAuditLogs: { type: Boolean, required: true },
      logRetentionDays: { type: Number, required: true },
      trackUserActions: { type: Boolean, required: true },
    },
    isActive: { type: Boolean, required: true },
    isUpdatable: { type: Boolean, required: true },
  },
  { timestamps: true }
);

const SystemSetting = mongoose.model('SystemSetting', SystemSettingModelSchema);

export default SystemSetting;
