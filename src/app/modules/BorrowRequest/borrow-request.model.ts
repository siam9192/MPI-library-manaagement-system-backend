import { model, Schema } from 'mongoose';
import { EBorrowRequestStatus, IBorrowRequest } from './borrow-request.interface';

const BorrowRequestModel = new Schema<IBorrowRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
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
    rejectedFor: {
      type: String,
      minlength: 1,
      trim: true,
      default: null,
    },
    expireAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EBorrowRequestStatus),
      default: EBorrowRequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const BorrowRequest = model<IBorrowRequest>('BorrowRequest', BorrowRequestModel);
export default BorrowRequest;
