import { model, Schema } from 'mongoose';
import { EBookCopyCondition, EBookCopyStatus, IBookCopy } from './book-copy.interface';

const BookCopyModelSchema = new Schema<IBookCopy>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EBookCopyStatus),
      default: EBookCopyStatus.AVAILABLE,
    },
    shelfLocation: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 30,
      required: true,
    },
    condition: {
      type: String,
      enum: Object.values(EBookCopyCondition),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const BookCopy = model<IBookCopy>('BookCopy', BookCopyModelSchema);

export default BookCopy;
