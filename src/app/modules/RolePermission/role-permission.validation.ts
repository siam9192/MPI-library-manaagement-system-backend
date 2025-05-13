import { z } from 'zod';

const BookPermissionsSchema = z.object({
  canView: z.boolean(),
  canAdd: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

const BorrowRequestPermissionsSchema = z.object({
  canView: z.boolean(), // must always be true
  canApprove: z.boolean(),
  canReject: z.boolean(),
  canOverrideDueDate: z.boolean(),
});

const ReservationPermissionsSchema = z.object({
  canView: z.boolean(),
  canProcess: z.boolean(),
});

const FinePermissionsSchema = z.object({
  canView: z.boolean(),
  canReceive: z.boolean(),
  canWaive: z.boolean(),
  canAdjust: z.boolean(),
});

const NotificationPermissionsSchema = z.object({
  canView: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canSend: z.boolean(),
});

const ReportPermissionsSchema = z.object({
  canGenerateBasic: z.boolean(),
  canGenerateAdvanced: z.boolean(),
});

const SystemPermissionsSchema = z.object({
  canReceiveNotifications: z.boolean(),
  canChangePassword: z.boolean(),
  canUpdateProfile: z.boolean(),
  canConfigureBasicSettings: z.boolean(),
  canConfigureCriticalSettings: z.boolean().optional(), // Optional for non-super users
});

const ManagementPermissionsSchema = z.object({
  canView: z.boolean(),
  canDelete: z.boolean(),
  canEdit: z.boolean(),
  canEditPermissions: z.boolean(),
});

const updateLibrarianPermissions = z
  .object({
    book: BookPermissionsSchema.partial(),
    borrowRequest: BorrowRequestPermissionsSchema.partial(),
    reservation: ReservationPermissionsSchema.partial(),
    fine: FinePermissionsSchema.partial(),
    student: ManagementPermissionsSchema.partial(),
    librarian: ManagementPermissionsSchema.partial(),
    report: ReportPermissionsSchema.partial(),
    system: SystemPermissionsSchema.partial(),
    notification: z
      .object({
        student: NotificationPermissionsSchema.partial(),
        librarian: NotificationPermissionsSchema.partial(),
      })
      .partial(),
  })
  .partial();

const updateAdminPermissions = z
  .object({
    book: BookPermissionsSchema.partial(),
    borrowRequest: BorrowRequestPermissionsSchema.partial(),
    reservation: ReservationPermissionsSchema.partial(),
    fine: FinePermissionsSchema.partial(),
    student: ManagementPermissionsSchema.partial(),
    librarian: ManagementPermissionsSchema.partial(),
    report: ReportPermissionsSchema.partial(),
    system: SystemPermissionsSchema.partial(),
    notification: z
      .object({
        student: NotificationPermissionsSchema.partial(),
        librarian: NotificationPermissionsSchema.partial(),
      })
      .partial(),
  })
  .partial();

// Main SuperPermissions schema
const updateSuperAdminPermissions = z
  .object({
    book: BookPermissionsSchema.partial(),
    borrowRequest: BorrowRequestPermissionsSchema.partial(),
    reservation: ReservationPermissionsSchema.partial(),
    fine: FinePermissionsSchema.partial(),
    student: ManagementPermissionsSchema.partial(),
    librarian: ManagementPermissionsSchema.partial(),
    admin: ManagementPermissionsSchema.partial(),
    report: ReportPermissionsSchema.partial(),
    system: SystemPermissionsSchema.partial(),
    notification: z
      .object({
        student: NotificationPermissionsSchema.partial(),
        librarian: NotificationPermissionsSchema.partial(),
        admin: NotificationPermissionsSchema.partial(),
      })
      .partial(),
  })
  .partial();

const updateStudentPermissions = z.object({
  canBorrowBook: z.boolean(),
  canRequestWaiveFine: z.boolean(),
  canEditProfile: z.boolean(),
  canChangePassword: z.boolean(),
  canUseSupport: z.boolean(),
  canConfigureBasicSettings: z.boolean(),
  canReceiveNotifications: z.boolean(),
  isEditable: z.boolean(),
});

export default {
  updateStudentPermissions,
  updateLibrarianPermissions,
  updateAdminPermissions,
  updateSuperAdminPermissions,
};
