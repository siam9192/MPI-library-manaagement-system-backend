
import dueBorrowReminder from './due-reminder-job.scheduler';
import fineReminder from './fine-reminder-job.schedule';
import recentAddedBookJobScheduler from './recent-added-book-job.scheduler';
import recentDeletedBookBookJobScheduler from './recent-deletedBook-book-job.scheduler';

export default function () {
  dueBorrowReminder();
  fineReminder();
  recentAddedBookJobScheduler()
  recentDeletedBookBookJobScheduler()
}
