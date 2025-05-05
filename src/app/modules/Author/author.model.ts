import { model, Schema } from 'mongoose';
import { EAuthorStatus, IAuthor } from './author.interface';

const AuthorModelSchema = new Schema<IAuthor>(
  {
    name: {
      type: String,
      minlength: 1,
      maxlength: 50,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    about: {
      type: String,
      minlength: 10,
      maxlength: 5000,
      required: true,
    },
    followersCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(EAuthorStatus),
    },
  },
  {
    timestamps: true,
  }
);

const Author = model<IAuthor>('Author', AuthorModelSchema);

export default Author;
