import { model, Schema } from 'mongoose';
import { EBookStatus, IBook } from './book.interface';

const BookModelSchema = new Schema<IBook>(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 20,
      required: true,
    },

    coverPhotoUrl: {
      type: String,
      required: true,
    },
    genre: {
      type: Schema.Types.ObjectId,
      ref: 'Genre',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    avgRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    count: {
      availableCopies: {
        type: Number,
        min: 0,
        required: true,
      },

      reviews: {
        type: Number,
        min: 0,
        default: 0,
      },
      wishListed: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(EBookStatus),
      default: EBookStatus.ACTIVE,
    },
    expectedAvailableDate: {
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

const Book = model<IBook>('Book', BookModelSchema);

export default Book;
