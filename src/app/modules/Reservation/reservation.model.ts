import { model, Schema } from 'mongoose';
import { EReservationStatus, IReservation } from './reservation.interface';

const ReservationModel = new Schema<IReservation>(
  {
    student: {
      ref: 'Student',
      type: Schema.Types.ObjectId,
      required: true,
    },
    book: {
      ref: 'Book',
      type: Schema.Types.ObjectId,
      required: true,
    },
    copy: {
      ref: 'BookCopy',
      type: Schema.Types.ObjectId,
      required: true,
    },
    request: {
      ref: 'BorrowRequest',
      type: Schema.Types.ObjectId,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },
    secret: {
      type: String,
      unique: true,
      minlength: 24,
      maxlength: 24,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EReservationStatus),
    },
    processedBy: {
      type: String,
      ref: 'Librarian',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = model<IReservation>('Reservation', ReservationModel);

export default Reservation;
