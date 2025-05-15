import authorNewBookInformer from './authorNewBookInformer.schedule';
import dueBorrowReminder from './dueBorrowReminder.scheduler';
import fineReminder from './fineReminder.schedule';

export default function () {
  authorNewBookInformer();
  dueBorrowReminder();
  fineReminder();
}
