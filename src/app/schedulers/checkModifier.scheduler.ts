import { EBorrowRecordStatus } from '../modules/BorrowRecord/borrow-record.interface';
import BorrowRecord from '../modules/BorrowRecord/borrow-record.model';
import { EBorrowRequestStatus } from '../modules/BorrowRequest/borrow-request.interface';
import BorrowRequest from '../modules/BorrowRequest/borrow-request.model';
import { EEmailVerificationRequestStatus } from '../modules/EmailVerificationRequest/email-verification-request.interface';
import EmailVerificationRequest from '../modules/EmailVerificationRequest/email-verification-request.model';
import { EManagementAccountRegistrationRequestStatus } from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.interface';
import ManagementAccountRegistrationRequest from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.model';
import { EReservationStatus } from '../modules/Reservation/reservation.interface';
import Reservation from '../modules/Reservation/reservation.model';
import { EStudentRegistrationRequestStatus } from '../modules/StudentRegistrationRequest/student-registration-request.interface';
import StudentRegistrationRequest from '../modules/StudentRegistrationRequest/studentRegistrationRequest.model';
import cron from 'node-cron';
export function checkModifier() {
  cron.schedule('*/5 * * * *', async () => {
    const expiredEmailVerifications = await EmailVerificationRequest.find({
      status: EEmailVerificationRequestStatus.PENDING,
      expireAt: {
        $lte: new Date(),
      },
    });

    const expiredStudentRegistrationRequests = await StudentRegistrationRequest.find({
      status: EStudentRegistrationRequestStatus.PENDING,
      expireAt: {
        $lte: new Date(),
      },
    });

    const expiredManagementAccountRegistrationRequests = await ManagementAccountRegistrationRequest.find({
      status: EStudentRegistrationRequestStatus.PENDING,
      expireAt: {
        $lte: new Date(),
      },
    });

    const expiredBorrowRequests = await BorrowRequest.find({
      status: EStudentRegistrationRequestStatus.PENDING,
      expireAt: {
        $lte: new Date(),
      },
    });

    const expiredReservations = await BorrowRequest.find({
      status: EReservationStatus.AWAITING,
      expireAt: {
        $lte: new Date(),
      },
    });

    const overdueBorrowRecords = await BorrowRecord.find({
      status: EBorrowRecordStatus.ONGOING,
      expireAt: {
        $lte: new Date(),
      },
    });

    // update expired email verification requests status
    EmailVerificationRequest.updateMany(
      {
        _id: {
          $in: expiredEmailVerifications.map((_) => _._id),
        },
      },
      {
        status: EEmailVerificationRequestStatus.EXPIRED,
      }
    );
    //  update expired student registration requests status
    StudentRegistrationRequest.updateMany(
      {
        _id: {
          $in: expiredStudentRegistrationRequests.map((_) => _._id),
        },
      },
      {
        status: EStudentRegistrationRequestStatus.EXPIRED,
      }
    );


     //  update expired management account registration requests status
    StudentRegistrationRequest.updateMany(
      {
        _id: {
          $in: expiredManagementAccountRegistrationRequests.map((_) => _._id),
        },
      },
      {
        status: EManagementAccountRegistrationRequestStatus.EXPIRED,
      }
    );

    //  update expired borrow requests status
    BorrowRequest.updateMany(
      {
        _id: {
          $in: expiredBorrowRequests.map((_) => _._id),
        },
      },
      {
        status: EBorrowRequestStatus.EXPIRED,
      }
    );

    //  update expired expired reservations status status
    Reservation.updateMany(
      {
        _id: {
          $in: expiredReservations.map((_) => _._id),
        },
      },
      {
        status: EReservationStatus.EXPIRED,
      }
    );

    // update Overdue borrow borrow records status
    BorrowRecord.updateMany(
      {
        _id: {
          $in: overdueBorrowRecords.map((_) => _._id),
        },
      },
      {
        status: EBorrowRecordStatus.OVERDUE,
      }
    );
  });
}
