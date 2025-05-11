import { model, Schema } from 'mongoose';
import { IBookReview } from './book-review.interface';

const BookReviewModelSchema = new Schema<IBookReview>({
  student: {
    type: Schema.ObjectId,
    ref: 'Student',
    required: true,
  },
  book: {
    type: Schema.ObjectId,
    ref: 'Book',
    required: true,
  },
  borrow: {
    type: Schema.ObjectId,
    ref: 'BorrowRecord',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

const BookReview = model<IBookReview>('BookReview', BookReviewModelSchema);

export default BookReview;
