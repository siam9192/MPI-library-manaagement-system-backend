import { model, Schema } from 'mongoose';
import { IHoldBorrowRequest } from './hold-borrow-request.interface';

const HoldBorrowRequestModelSchema = new Schema<IHoldBorrowRequest>(
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

const HoldBorrowRequest = model<IHoldBorrowRequest>(
  'HoldBorrowRequest',
  HoldBorrowRequestModelSchema
);

export default HoldBorrowRequest;
