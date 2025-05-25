import cron from 'node-cron';
import cacheService from '../cache/cache.service';
import Waitlist from '../modules/Waitlist/waitlist.model';
import { objectId } from '../helpers';
import Book from '../modules/Book/book.model';
import { IStudent } from '../modules/Student/student.interface';
import { ENotificationType } from '../modules/Notification/notification.interface';
import Notification from '../modules/Notification/notification.model';

export default async function deletedBookRelatedJobScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    const recentDeletedBookIds = cacheService.getCachedDeletedBookIds();

    const waitlistItemIds = [];
    const notificationsData = [];

    for (const bookId of recentDeletedBookIds) {
      const book = await Book.findById(bookId);
      if (!book) continue;
      const waitlist = await Waitlist.find({
        book: objectId(bookId),
      }).populate('student');

      for (const item of waitlist) {
        const student = item.student as any as IStudent;
        notificationsData.push({
          user: student.user,
          message: `We’re sorry, but your request for "${book.name}" couldn’t be fulfilled, as this title has been permanently removed from our library collection. We truly appreciate your interest, and hope you’ll find another great read with us soon.`,
          type: ENotificationType.INFO,
        });
        waitlistItemIds.push(item._id);
      }
    }

    Waitlist.deleteMany({
      _id: {
        $in: waitlistItemIds,
      },
    });
    Notification.insertMany(notificationsData);
  });
}
