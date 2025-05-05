import { model, now, Schema } from 'mongoose';
import { EBorrowStatus, EReturnStatus, IBorrow } from './borrow.interface';

const BorrowModel = new Schema<IBorrow>(
  {
    request: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowRequest',
      required: true,
    },
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
    handedOveredBy: {
      type: Schema.Types.ObjectId,
      ref: 'Librarian',

      required: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Librarian',
      default: null,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    returnStatus: {
      type: String,
      enum: Object.values(EReturnStatus),
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EBorrowStatus),
      default: EBorrowStatus.ONGOING,
    },
  },
  {
    timestamps: true,
  }
);

const Borrow = model<IBorrow>('Borrow', BorrowModel);

export default Borrow;
