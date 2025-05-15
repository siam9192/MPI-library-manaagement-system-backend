import { model, Schema } from 'mongoose';
import { IWishlistBook } from './wishlist.interface';

const WishlistBookModelSchema = new Schema<IWishlistBook>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'students',
    },
  },
  {
    timestamps: true,
  }
);

const WishlistBook = model<IWishlistBook>('Wishlist', WishlistBookModelSchema);

export default WishlistBook;
