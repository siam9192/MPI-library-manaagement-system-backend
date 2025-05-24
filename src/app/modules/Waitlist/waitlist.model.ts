import { model, Schema } from 'mongoose';
import { IWaitlist } from './waitlist.interface';

const WaitlistModelSchema = new Schema<IWaitlist>(
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

const Waitlist = model<IWaitlist>('waitlist', WaitlistModelSchema);

export default Waitlist;
