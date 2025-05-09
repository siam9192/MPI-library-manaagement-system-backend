import { model, now, Schema } from 'mongoose';
import { EBorrowRecordStatus, IBorrowRecord } from './borrow.interface';

const BorrowModel = new Schema<IBorrowRecord>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Librarian',
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EBorrowRecordStatus),
      default: EBorrowRecordStatus.ONGOING,
    },
  },
  {
    timestamps: true,
  }
);

const BorrowRecord = model<IBorrowRecord>('Borrow', BorrowModel);

export default BorrowRecord;
