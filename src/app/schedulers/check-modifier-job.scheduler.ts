import { IBook } from '../modules/Book/book.interface';
import { EBorrowRecordStatus } from '../modules/BorrowRecord/borrow-record.interface';
import BorrowRecord from '../modules/BorrowRecord/borrow-record.model';
import { EBorrowRequestStatus } from '../modules/BorrowRequest/borrow-request.interface';
import BorrowRequest from '../modules/BorrowRequest/borrow-request.model';
import { EEmailVerificationRequestStatus } from '../modules/EmailVerificationRequest/email-verification-request.interface';
import EmailVerificationRequest from '../modules/EmailVerificationRequest/email-verification-request.model';
import { EManagementAccountRegistrationRequestStatus } from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.interface';
import ManagementAccountRegistrationRequest from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.model';
import { ENotificationType } from '../modules/Notification/notification.interface';
import { EReservationStatus } from '../modules/Reservation/reservation.interface';
import Reservation from '../modules/Reservation/reservation.model';
import { IStudent } from '../modules/Student/student.interface';
import { EStudentRegistrationRequestStatus } from '../modules/StudentRegistrationRequest/student-registration-request.interface';
import StudentRegistrationRequest from '../modules/StudentRegistrationRequest/studentRegistrationRequest.model';
import cron from 'node-cron';
import { Student } from '../modules/Student/student.model';
import Notification from '../modules/Notification/notification.model';
import systemSettingService from '../modules/SystemSetting/system-setting.service';
export function checkModifier() {
  cron.schedule('*/5 * * * *', async () => {
    const setting = await systemSettingService.getCurrentSettings();
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

    const expiredManagementAccountRegistrationRequests =
      await ManagementAccountRegistrationRequest.find({
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
    }).populate(['student', 'book']);

    const expiredReservations = await BorrowRequest.find({
      status: EReservationStatus.AWAITING,
      expireAt: {
        $lte: new Date(),
      },
    }).populate(['student', 'book']);

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
    ).then(() => {
      const notificationsData = [];
      for (const borrow of expiredBorrowRequests) {
        const book = borrow.book as any as IBook;
        const student = borrow.student as any as IStudent;

        notificationsData.push({
          user: student.user,
          type: ENotificationType.INFO,
          message: `The borrow request for "${book.name}" has expired due to no response. Please place a new request if you still wish to borrow this title.
`,
        });
      }
      Notification.insertMany(notificationsData);
    });

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
    ).then(() => {
      const notificationsData = [];
      for (const reservation of expiredReservations) {
        const book = reservation.book as any as IBook;
        const student = reservation.student as any as IStudent;
        const reputationLoss = setting.reservationPolicy.reputationLoss.onExpire;
        const updatedReputation = student.reputationIndex - reputationLoss;
        Student.updateOne(
          {
            _id: student._id,
          },
          {
            reputationIndex: updatedReputation < 0 ? 0 : updatedReputation,
          }
        );

        notificationsData.push({
          user: student.user,
          type: ENotificationType.INFO,
          message: `Your reservation for the book "${book.name}" has expired because you did not pick it up in time. As a result, You lost ${reputationLoss} reputation points.
`,
        });
      }
      Notification.insertMany(notificationsData);
    });

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
