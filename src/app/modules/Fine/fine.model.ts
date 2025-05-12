import { model, now, Schema } from 'mongoose';
import { EFineStatus, IFine } from './fine.interface';

const FineModel = new Schema<IFine>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    borrow: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowRecord',
      required: true,
    },
    amount: {
      type: Number,
      min: 1,
      required: true,
    },
    reason: {
      type: String,
      minlength: 1,
      maxlength: 50,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EFineStatus),
      default:EFineStatus.UNPAID
    },
    issuedDate: {
      type: Date,
      default: now,
    },
    paidDate: {
      type: Date,
      default: null,
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

const Fine = model<IFine>('Fine', FineModel);

export default Fine;
