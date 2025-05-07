import { model, Schema } from 'mongoose';
import { IFollow } from './Follow.interface';

const FollowModelSchema = new Schema<IFollow>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Author',
  },
});

const Follow = model<IFollow>('Follow', FollowModelSchema);

export default Follow;
