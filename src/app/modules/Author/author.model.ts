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
    biography: {
      type: String,
      minlength: 10,
      maxlength: 5000,
      required: true,
    },
    slug: {
      type: String,
      minlength: 1,
      unique: true,
      required: true,
    },
    count: {
      followers: {
        type: Number,
        min: 0,
        default: 0,
      },
      books: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: Object.values(EAuthorStatus),
      default:EAuthorStatus.ACTIVE
    },
  },
  {
    timestamps: true,
  }
);

const Author = model<IAuthor>('Author', AuthorModelSchema);

export default Author;
