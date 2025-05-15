import { Types } from "mongoose";

interface AuditLog {}



export enum  EAuditLogCategory {
  STUDENT_REGISTRATION = 'student_registration',
  ADMINISTRATOR_REGISTRATION = 'administrator_registration',

  USER = 'user',
  STUDENT = 'student',
  LIBRARIAN = 'LIBRARIAN',
  ADMINISTRATOR = 'administrator',

  DEPARTMENT = 'department',
  AUTHOR = 'author',
  FOLLOW = 'follow',
  GENRE = 'genre',
  BOOK = 'book',
  BOOK_COPY = 'book_copy',
  BORROW_REQUEST = 'borrow_request',
  RESERVATION = 'reservation',
  BORROW_RECORD = 'borrow_record',
  FINE = 'fine',
  BOOK_REVIEW = 'book_review',
  BORROW_HISTORY = 'borrow_history',
  SUPPORT = 'support',
 SYSTEM_SETTING = 'system_setting',
  NOTIFICATION = 'notification'
}


export enum EStudentRegistrationAction {
  APPROVE = 'approve',
  REJECT = 'reject'
}


export enum EAdministratorAction {
  CREATE = 'create',
  CANCEL = 'cancel'
}

export enum EUserAction {
  DELETE = 'delete',
  CHANGE_STATUS_BLOCKED = 'change_status:blocked',
   CHANGE_STATUS_ACTIVE = 'change_status:active',
}

export enum EDepartmentAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum EAuthorAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}


export enum EGenreAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum EBookAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum EBookCopyAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}


export enum EBorrowRequest {
  CREATE = 'create',
  CANCEL = 'cancel',
  APPROVE = 'approve',
  REJECT = 'reject'
}

export enum EReservationAction {
  CANCEL = 'cancel',
  PROCESS_CHECKOUT = 'process:checkout'
}



export enum EBorrowAction {
  CREATE = 'create',
  PROCESS_RETURN = 'process:return',
  PROCESS_LOST = 'process:lost'
}

export enum EFineAction {
  APPLY = 'apply',
  PAY = 'pay',
  WAIVE = 'waive'
}

export enum EBookReviewAction {
  CHANGE_STATUS_HIDDEN = 'change_status:hidden',
  CHANGE_STATUS_VISIBLE = 'change_status:visible'
}


export enum ESupportAction {
  RESOLVE = 'resolve',
  FAIL  = 'fail'
} 

export enum ESystemSettingAction {
 UPDATE = 'update'
}


export interface IAuditLog   {
  performedBy:Types.ObjectId,
  category:EAuditLogCategory,
  action:string,
  description:string,
  metaData: Record<string, unknown>;
}