import { model, Schema } from 'mongoose';
import { EFineStatus, IFine } from './fine.interface';

const FineModel = new Schema<IFine>(
  {
    borrow: {
      type: Schema.Types.ObjectId,
      ref: 'Borrow',
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
    },
  },
  {
    timestamps: true,
  }
);

const Fine = model<IFine>('Fine', FineModel);

export default Fine;
