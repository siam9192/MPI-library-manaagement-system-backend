import { Types } from 'mongoose';
import { IModelNecessaryFields, TGender, TSemester } from './types/model.type';
import { TShift } from './modules/Student/student.interface';

interface IUser extends IModelNecessaryFields {
  email: string;
  roll?: number;
  password: string;
  role: TUserRole;
  status: TUserStatus;
  isDeleted: boolean;
  lastLoginAt?: Date;
}

interface IEmailVerificationRequest extends IModelNecessaryFields {
  email: string;
  otp: string;
  otpResendCount: number;
  expireAt: Date;
  status: TEmailVerificationRequestStatus;
}

type TEmailVerificationRequestStatus = `${EEmailVerificationRequestStatus}`;

enum EEmailVerificationRequestStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

interface IStudentRegistrationRequest extends IModelNecessaryFields {
  fullName: string;
  gender: TGender;
  roll: number;
  email: string;
  department: string;
  semester: TSemester;
  shift: TShift;
  session: string;
  password: string;
  isEmailVerified: boolean;
  expireAt: Date;
  status: TStudentRegistrationRequestStatus;
  reasonForReject?: string;
  index: number;
}

type TStudentRegistrationRequestStatus = `${EStudentRegistrationRequestStatus}`;

enum EStudentRegistrationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

interface IStudent extends IModelNecessaryFields {
  user: Types.ObjectId | IUser;
  fullName: string;
  roll: number;
  gender: TGender;
  profilePhotoUrl: string;
  department: Types.ObjectId;
  currentSemester: number;
  shift: TShift;
  session: string;
  phoneNumber?: string;
  address?: TUserAddress;
  reputationIndex: number;
}

interface ILibrarian extends IModelNecessaryFields {
  user: Types.ObjectId | IUser;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  about: string;
  contactInfo: TContactInfo;
  permissions: TLibrarianPermissions;
}

type Permission = {
  read: boolean;
  write: boolean;
  delete: boolean;
};

type TLibrarianPermissions = {
  books: Permission;
  users: Permission;
  librarians: Permission;
  admins: Permission;
  settings: Permission;
  reports: Permission;
};

type TContactInfo = {
  emailAddress: string;
  phoneNumber: string;
};

interface IAdministrator {
  user: Types.ObjectId | IUser;
  fullName: string;
  gender: TGender;
  profilePhotoUrl: string;
  about: string;
  contactInfo: TContactInfo;
  permissions: TAdministratorPermissions;
}

type TAdministratorPermissions = {
  canConfigureSystem: boolean;
  canManageUsers: boolean;
  canAuditLogs: boolean;
};

type TUserRole = `${EUserRole}`;

enum EUserRole {
  STUDENT = 'student',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

type TUserStatus = `${EUserStatus}`;
enum EUserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

interface IBook {
  _id: Types.ObjectId;
  name: string;
  coverPhotoUrl: string;
  genres: Types.ObjectId[];
  author: Types.ObjectId;
  totalCopies: number;
  availableCopies: number;
  avgRating: number;
  reviewCount: number;
  wishListedCount: number;
  exceptedAvailableDate?: Date;
  status: TBookStatus;
  deleted: boolean;
}

interface IBookCopies extends IModelNecessaryFields {
  book: Types.ObjectId;
  status: TBookCopyStatus;
  shelfLocation: string;
  condition: TCopyConditionStatus;
}

type TCopyConditionStatus = `${ECopyConditionStatus}`;

enum ECopyConditionStatus {
  Good = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

type TBookCopyStatus = `${EBookCopyStatus}`;

enum EBookCopyStatus {
  AVAILABLE = 'available',
  CHECKED_OUT = 'checked_out',
  RESERVED = 'reserved',
  Lost = 'lost',
  DAMAGED = 'damaged',
  DISCARDED = 'discarded',
}

type TBookStatus = `${EBookStatus}`;

enum EBookStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

interface IBorrowRequest {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  book: Types.ObjectId;
  borrowForDays: number;
  rejectedFor?: string;
  expireAt: Date;
  status: TBorrowRequestStatus;
}

type TBorrowRequestStatus = `${EBorrowRequestStatus}`;

enum EBorrowRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

interface IReservation {
  id: Types.ObjectId;
  student: Types.ObjectId;
  book: Types.ObjectId;
  reservationDate: Date;
  expiryDate: Date;
  status: TReservationStatus;
  qrCode: string;
}

type TReservationStatus = `${EReservationStatus}`;

enum EReservationStatus {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  CANCELED = 'canceled',
}

interface IBorrowRecord {
  request: Types.ObjectId;
  book: Types.ObjectId;
  student: Types.ObjectId;
  dueDate: Types.ObjectId;
  returnDate: Types.ObjectId | null;
}

enum EBorrowRecordEnum {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'Lost',
}

interface IFine {
  id: Types.ObjectId;
  student: Types.ObjectId;
  borrow: Types.ObjectId;
  amount: number;
  reason: TFineReason;
  status: TFineStatus;
  issuedDate: Date;
  paidDate: Date | null;
}

type TFineReason = `${EFineReason}`;

enum EFineReason {
  LATE_RETURN = 'late return',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

type TFineStatus = `${EFineStatus}`;
enum EFineStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  waived = 'waived',
}

interface IBookReview extends IModelNecessaryFields {
  borrow: Date;
  student: Date;
  rating: number;
}

interface INotification extends IModelNecessaryFields {
  student: Types.ObjectId;
  type: TNotificationType;
  message: string;
  isRead: boolean;
}

type TNotificationType = `${ENotificationType}`;

enum ENotificationType {
  DUE_REMINDER = 'due reminder',
  AVAILABILITY = 'availability',
  RESERVATION = 'reservation',
  FINE = 'fine',
}
interface ISystemSetting extends IModelNecessaryFields {
  maxBorrowDays: number;
  maxBorrowItems: number;
  lateFeePerDay: number;
  reservationExpiryDays: number;
  studentRegistrationRequestExpiryDays: number;
  managementRegistrationRequestExpiryDays: number;
  emailVerificationExpiryMinutes: number;
  isActive: boolean;
}

type TUserAddress = {
  present?: TAddress;
  permanent?: TAddress;
  currentIsPresent?: boolean;
};

type TAddress = {
  street: string;
  city: string;
  district: string;
  country: string;
};

interface IAuthor extends IModelNecessaryFields {
  _id: Types.ObjectId;
  name: string;
  photoUrl: string;
  biography: string;
  followersCount: number;
  status: TAuthorStatus;
}

type TAuthorStatus = `${EAuthorStatus}`;

enum EAuthorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

interface IFollow extends IModelNecessaryFields {
  student: Types.ObjectId;
  author: Types.ObjectId;
}

interface IAuditLogs extends IModelNecessaryFields {
  action: string;
  performedBy: Types.ObjectId;
  targetUser: Types.ObjectId;
}
