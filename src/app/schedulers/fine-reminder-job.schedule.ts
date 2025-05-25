import corn from 'node-cron';
import { IUser } from '../modules/User/user.interface';
import { IStudent } from '../modules/Student/student.interface';
import { IBook } from '../modules/Book/book.interface';
import { ENotificationType } from '../modules/Notification/notification.interface';
import Notification from '../modules/Notification/notification.model';
import Fine from '../modules/Fine/fine.model';
import { EFineStatus } from '../modules/Fine/fine.interface';
import { IBorrowRecord } from '../modules/BorrowRecord/borrow-record.interface';

export default function fineReminder() {
  corn.schedule('0 0 * * *', async () => {
    const issuedBeforeDate = new Date();
    issuedBeforeDate.setDate(issuedBeforeDate.getDate() - 1);

    const pendingFines = await Fine.find({
      issuedDate: {
        $lte: issuedBeforeDate,
      },
      status: EFineStatus.UNPAID,
    }).populate([
      'student',
      {
        path: 'borrow',
        populate: 'student',
      },
    ]);

    const notificationsData = [];

    for (const fine of pendingFines) {
      const student = fine.student as any as IStudent;
      const user = student.user as IUser;
      const borrow = fine.borrow as any as IBorrowRecord;
      const book = borrow.book as any as IBook;
      notificationsData.push({
        user: user._id,
        message: `Your fine for the book "${book.name}" is still unpaid. Continued delay may result in additional penalties.`,
        type: ENotificationType.WARNING,
      });
    }
    Notification.insertMany(notificationsData);
  });
}
