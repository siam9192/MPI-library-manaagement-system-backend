import corn from 'node-cron';
import BorrowRecord from '../modules/BorrowRecord/borrow-record.model';
import { EBorrowRecordStatus } from '../modules/BorrowRecord/borrow-record.interface';
import { IUser } from '../modules/User/user.interface';
import { IStudent } from '../modules/Student/student.interface';
import { IBook } from '../modules/Book/book.interface';
import { ENotificationType } from '../modules/Notification/notification.interface';
import Notification from '../modules/Notification/notification.model';
export default function () {}

corn.schedule('0 0 * * *', async () => {
  const minDate = new Date(new Date().toDateString());
  let maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + 1);
  const almostOverdueBorrowRecords = await BorrowRecord.find({
    dueDate: {
      $gt: minDate,
      $lte: maxDate,
    },
    status: EBorrowRecordStatus.ONGOING,
  }).populate('student book');

  const notificationsData = [];

  for (const borrow of almostOverdueBorrowRecords) {
    const student = borrow.student as any as IStudent;
    const user = student.user as IUser;
    const book = borrow.book as any as IBook;

    notificationsData.push({
      user: user._id,
      message: `Your borrowed book "${book.name}" will become overdue starting tomorrow. Please return it before the due date to avoid a fine.`,
      type: ENotificationType.WARNING,
    });
  }
  Notification.insertMany(notificationsData);

  const overdueDueBorrows = await BorrowRecord.find({
    dueDate: {
      $lte: new Date(),
    },
    status: EBorrowRecordStatus.ONGOING,
  }).populate('student book');

  const overDueNotificationsData = [];

  for (const borrow of overdueDueBorrows) {
    const student = borrow.student as any as IStudent;
    const user = student.user as IUser;
    const book = borrow.book as any as IBook;
    overDueNotificationsData.push({
      user: user._id,
      message: `Your book "${book.name}" is overdue. Please return it as soon as possible. The longer the delay, the higher the fine will be.`,
      type: ENotificationType.WARNING,
    });
  }
  Notification.insertMany(overDueNotificationsData);
});
