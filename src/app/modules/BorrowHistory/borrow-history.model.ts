import { model, Schema } from 'mongoose';
import { IBorrowHistory } from './borrow-history.interface';

const BorrowHistoryModelSchema = new Schema<IBorrowHistory>({
  title: {
    type: String,
    minlength: 1,
    maxlength: 50,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    minlength: 1,
    maxlength: 100,
    trim: true,
    required: true,
  },
  student: {
    type:Schema.Types.ObjectId,
    ref:"Student"
  },
  book: {
    type:Schema.Types.ObjectId,
    ref:"Book"
  },
},{
  timestamps:true
});



const BorrowHistory = model<IBorrowHistory>("BorrowHistory",BorrowHistoryModelSchema);

export default BorrowHistory