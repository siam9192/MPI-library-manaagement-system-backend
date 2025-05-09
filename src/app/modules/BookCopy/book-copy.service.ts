import { startSession } from "mongoose";
import AppError from "../../Errors/AppError";
import { objectId } from "../../helpers";
import httpStatus from "../../shared/http-status";
import Book from "../Book/book.model";
import { EBookCopyStatus, ICreateBookCopyPayload, IUpdateBookCopyPayload } from "./book-copy.interface";
import BookCopy from "./book-copy.model";

class BookCopyService  {
    async createBookCopyIntoDB (payload:ICreateBookCopyPayload){
        const book = await Book.findOne({
            _id:objectId(payload.bookId)
        })
        if(!book) {
            throw new AppError(httpStatus.NOT_FOUND,"Book not found")
        }

        const session = await startSession()
        session.startTransaction() 

       try {
         const [createdCopy] = await BookCopy.create([{
            book:payload.bookId,
            shelfLocation:payload.shelfLocation,
            condition:payload.condition
         }],{session})

        await Book.updateOne({_id:objectId(payload.bookId)},{
          
             $inc:{
              "count.totalCopies":1,
              "count.availableCopies":1
            }
           
        },{session})

        await session.commitTransaction()
        return createdCopy

       } catch (error) {
        console.log(error)
        await session.abortTransaction()
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR,"Internal server error!.Book copy could not be created")
       }

       finally {
        session.endSession()
       }
    }

    async updateBookCopyIntoDB (id:string,payload:IUpdateBookCopyPayload) {
      
     const copy = await BookCopy.findOne({
        _id:objectId(id),
        status:{
            $ne:EBookCopyStatus.DELETED
        }
     })

     if(!copy){
        throw new AppError(httpStatus.NOT_FOUND,"Book copy not found")
     }
   
    return await BookCopy.findByIdAndUpdate(id,payload)
    }

    async getBookCopiesFromDB (bookId:string) {
     return  await BookCopy.find({
        book:objectId(bookId),
        status:{
            $ne:EBookCopyStatus.DELETED
        }
      })
    }

    async deleteBookCopyIntoDB  (id:string){
        const copy = await BookCopy.findOne({_id:objectId(id),status:{
            $ne:EBookCopyStatus.DELETED
        }}) 

        if(!copy){
            throw new AppError(httpStatus.NOT_FOUND,"Book copy not found")
        }
  
        if ([EBookCopyStatus.CHECKED_OUT, EBookCopyStatus.LOST, EBookCopyStatus.RESERVED].includes(copy.status)) {
            throw new AppError(
              httpStatus.FORBIDDEN,
              `The book copy is not available for this operation as its current status is '${copy.status}'.`
            );
          }
          

    }
}


export default new BookCopyService()