import { model, now, Schema } from 'mongoose';
import { EBorrowRecordStatus, IBorrowRecord } from './borrow-record.interface';

const BorrowModel = new Schema<IBorrowRecord>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    copy: {
      type: Schema.Types.ObjectId,
      ref: 'BookCopy',
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
    returnCondition: {
      type: String,
      enum: Object.values(EBorrowRecordStatus),
      default: EBorrowRecordStatus.ONGOING,
    },
    isOverDue: {
      type: Boolean,
      default: false,
    },
    fine: {
      type: Schema.Types.ObjectId,
      ref: 'Fine',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EBorrowRecordStatus),
      default: EBorrowRecordStatus.ONGOING,
    },
    index: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const BorrowRecord = model<IBorrowRecord>('Borrow', BorrowModel);

export default BorrowRecord;
