import { model, Schema } from 'mongoose';
import { EReservationStatus, IReservation } from './reservation.interface';

const ReservationModel = new Schema<IReservation>(
  {
    book: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    request: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    qty: {
      type: Number,
      enum: [1],
      default: 1,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    secret: {
      type: String,
      minlength: 1,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EReservationStatus),
    },
  },
  {
    timestamps: true,
  }
);

const Reservation = model<IReservation>('Reservation', ReservationModel);

export default Reservation;
