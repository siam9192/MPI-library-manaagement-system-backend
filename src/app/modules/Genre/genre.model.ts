import { model, Schema } from 'mongoose';
import { EGenreStatus, IGenre } from './genre.interface';

const GenreModelSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      minlength: 1,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(EGenreStatus),
      default:EGenreStatus.ACTIVE
    },
  },
  {
    timestamps: true,
  }
);

const Genre = model<IGenre>('Genre', GenreModelSchema);
export default Genre;
