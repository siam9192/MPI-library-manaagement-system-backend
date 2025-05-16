import { Types } from 'mongoose';
import { IModelNecessaryFields } from '../../types/model.type';

export interface IBorrowHistory extends IModelNecessaryFields {

  title: string;
  description: string;
  student:Types.ObjectId
  book: Types.ObjectId;
  borrowId:Types.ObjectId,
  action:EBorrowHistoryAction
}
export enum EBorrowHistoryAction {
  NONE = 'none',
  DOWNLOAD_TICKET = 'download_ticket',
}
