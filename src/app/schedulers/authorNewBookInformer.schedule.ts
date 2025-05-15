import cron from 'node-cron';
import cacheService from '../cache/cache.service';
import Book from '../modules/Book/book.model';
import { EBookStatus } from '../modules/Book/book.interface';
import Follow from '../modules/Follow/Follow.model';
import { IStudent } from '../modules/Student/student.interface';
import { IUser } from '../modules/User/user.interface';
import Notification from '../modules/Notification/notification.model';
import { IAuthor } from '../modules/Author/author.interface';
import {
  ENotificationAction,
  ENotificationType,
} from '../modules/Notification/notification.interface';
export default async function authorNewBookInformer() {
  cron.schedule('*/10 * * * *', async () => {
    const newBookIds = await cacheService.getCachedNewBookIds();

    const books = await Book.find({
      _id: {
        $in: newBookIds,
      },
      status: EBookStatus.ACTIVE,
    }).populate('author');

    for (const book of books) {
      const author = book.author as any as IAuthor;
      const followers = await Follow.find({
        author: author._id,
      }).populate({
        path: 'student',
        populate: 'user',
      });

      const studentsRequireData = followers.map((_) => {
        const student = _.student as any as IStudent;
        const user = student.user as IUser;

        return {
          name: student.fullName,
          userId: user._id,
          email: user.email,
        };
      });
      const notificationsData = studentsRequireData.map((student) => ({
        user: student.userId,
        message: `A new book titled [${book.name}] by your followed author [${author.name}] has recently arrived in the library.`,
        type: ENotificationType.INFO,
        action: ENotificationAction.LINK_VISIT,
        metaData: {
          bookId: book._id,
          authorId: author._id,
        },
      }));
      await Notification.insertMany(notificationsData);
    }
  });
}
