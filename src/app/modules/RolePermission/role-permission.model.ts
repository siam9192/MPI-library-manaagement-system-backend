import mongoose, { Schema, Document } from 'mongoose';
import { EUserRole } from '../../type';
import {IRolePermission, TBorrowRequestPermissions, TStudentPermissions } from './role-permission.interface';


const NotificationPermissionsSchema = new Schema({
  canView: Boolean,
  canEdit: Boolean,
  canDelete: Boolean,
  canSend: Boolean,
}, { _id: false });

const BookPermissionsSchema = new Schema({
  canView: Boolean,
  canAdd: Boolean,
  canEdit: Boolean,
  canDelete: Boolean,
}, { _id: false });

const BorrowRequestPermissionsSchema = new Schema<TBorrowRequestPermissions>({
  canApprove: Boolean,
  canReject: Boolean,
  canOverrideDueDate: Boolean,
}, { _id: false });

const ReservationPermissionsSchema = new Schema({
  canView: Boolean,
  canProcess: Boolean,
}, { _id: false });

const FinePermissionsSchema = new Schema({
  canView: Boolean,
  canReceive: Boolean,
  canWaive: Boolean,
  canAdjust: Boolean,
}, { _id: false });

const ReportPermissionsSchema = new Schema({
  canGenerateBasic: Boolean,
  canGenerateAdvanced: Boolean,
}, { _id: false });

const SystemPermissionsSchema = new Schema({
  canReceiveNotifications: Boolean,
  canChangePassword: Boolean,
  canUpdateProfile: Boolean,
  canConfigureBasicSettings: Boolean,
  canConfigureCriticalSettings: { type: Boolean, default: false },
}, { _id: false });

const StudentManagementPermissionsSchema = new Schema({
  canView: Boolean,
  canDelete: Boolean,
  canEdit: Boolean,
  canEditPermissions: Boolean,
}, { _id: false });

const LibrarianManagementPermissionsSchema = new Schema({
  canViewLibrarians: Boolean,
  canDeleteLibrarians: Boolean,
  canEditLibrarians: Boolean,
  canEditPermissions: Boolean,
}, { _id: false });

const AdminManagementPermissionsSchema = new Schema({
  canView: Boolean,
  canDelete: Boolean,
  canEdit: Boolean,
  canEditPermissions: Boolean,
}, { _id: false });

// ---- Full Permissions Structure Schema ----

const SuperAdminPermissionsSchema = new Schema({
  book: {
    type:BookPermissionsSchema,
    required:true
  },
  borrowRequest:{
    type:BorrowRequestPermissionsSchema,
    required:true
  },
  reservation: {
    type:ReservationPermissionsSchema,
    required:true
  },
  fine:{
    type:FinePermissionsSchema,
    required:true
  },
  student: {
    type:StudentManagementPermissionsSchema,
    required:true
  },
  librarian: {
    type:LibrarianManagementPermissionsSchema,
    required:true
  },
  admin:{
    type:AdminManagementPermissionsSchema,
    required:true
  },
  report: {
    type:ReportPermissionsSchema,
    required:true
  },
  system: {
    type:SystemPermissionsSchema,
    required:true
  },
  notification: {
    student: NotificationPermissionsSchema,
    librarian: NotificationPermissionsSchema,
    admin: NotificationPermissionsSchema,
  },
  isEditable: Boolean,
}, { _id: false });

export const AdminPermissionsSchema = new Schema({
  book: {
    type:BookPermissionsSchema,
    required:true
  },
  borrowRequest:{
    type:BorrowRequestPermissionsSchema,
    required:true
  },
  reservation: {
    type:ReservationPermissionsSchema,
    required:true
  },
  fine:{
    type:FinePermissionsSchema,
    required:true
  },
  student: {
    type:StudentManagementPermissionsSchema,
    required:true
  },
  librarian: {
    type:LibrarianManagementPermissionsSchema,
    required:true
  },
  report: {
    type:ReportPermissionsSchema,
    required:true
  },
  system: {
    type:SystemPermissionsSchema,
    required:true
  },
  notification: {
    student: NotificationPermissionsSchema,
    librarian: NotificationPermissionsSchema
  },
  isEditable: Boolean,
}, { _id: false });


export const LibrarianPermissionSchema = new Schema({
  book: {
    type:BookPermissionsSchema,
    required:true
  },
  borrowRequest:{
    type:BorrowRequestPermissionsSchema,
    required:true
  },
  reservation: {
    type:ReservationPermissionsSchema,
    required:true
  },
  fine:{
    type:FinePermissionsSchema,
    required:true
  },
  student: {
    type:StudentManagementPermissionsSchema,
    required:true
  },
 
  report: {
    type:ReportPermissionsSchema,
    required:true
  },
  system: {
    type:SystemPermissionsSchema,
    required:true
  },
  notification: {
    student: NotificationPermissionsSchema,
  },
  isEditable: Boolean,
}, { _id: false });

export const StudentPermissionsSchema = new Schema<TStudentPermissions>({
  canBorrowBook: { type: Boolean, required: true },
  canRequestWaiveFine: { type: Boolean, required: true },
  canEditProfile: { type: Boolean, required: true },
  canChangePassword: { type: Boolean, required: true },
  canUseSupport: { type: Boolean, required: true },
  canConfigureBasicSettings: { type: Boolean, required: true },
  canReceiveNotifications: { type: Boolean, required: true },
});

const PermissionsSchema = new Schema({
  book: BookPermissionsSchema,
  borrowRequest: BorrowRequestPermissionsSchema,
  reservation: ReservationPermissionsSchema,
  student: StudentManagementPermissionsSchema,
  librarian: LibrarianManagementPermissionsSchema,
  admin: AdminManagementPermissionsSchema,
  report: ReportPermissionsSchema,
  system: SystemPermissionsSchema,
  notification: {
    student: NotificationPermissionsSchema,
    librarian: NotificationPermissionsSchema,
    admin: NotificationPermissionsSchema,
  },
  isEditable: Boolean,
}, { _id: false });


const PermissionSchema = new Schema<IRolePermission>({
  role: {
    type: String,
    enum: Object.values(EUserRole),
    required: true,
  },
  permissions: {
    type:Schema.Types.Mixed,
    required:true
  },
});

const RolePermission = mongoose.model<IRolePermission>('Permission', PermissionSchema);

export default RolePermission
