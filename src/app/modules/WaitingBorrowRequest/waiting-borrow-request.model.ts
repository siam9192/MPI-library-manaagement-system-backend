import { model, Schema } from 'mongoose';
import { IWaitingBorrowRequest } from './waiting-borrow-request.interface';

const WaitingBorrowRequestModelSchema = new Schema<IWaitingBorrowRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    borrowForDays: {
      type: Number,
      min: 1,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const WaitingBorrowRequest = model<IWaitingBorrowRequest>(
  'WaitingBorrowRequest',
  WaitingBorrowRequestModelSchema
);

export default WaitingBorrowRequest;
