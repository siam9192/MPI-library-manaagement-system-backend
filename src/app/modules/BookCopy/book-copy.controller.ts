import httpStatus from "../../shared/http-status";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import bookService from "../Book/book.service";
import bookCopyService from "./book-copy.service";

class BookController {
    createBookCopy = catchAsync(async (req, res) => {
        const result = await bookCopyService.createBookCopyIntoDB(req.body);
        sendSuccessResponse(res, {
          message: 'Book copy created successfully',
          statusCode: httpStatus.OK,
          data: result,
        });
      });

     updateBookCopy = catchAsync(async (req, res) => {
        const result = await bookCopyService.updateCopyIntoDB (req.params.id,req.body);
        sendSuccessResponse(res, {
          message: 'Book copy created successfully',
          statusCode: httpStatus.OK,
          data: result,
        });
      });

      deleteBookCopy = catchAsync(async (req, res) => {
        const result = await bookCopyService.deleteBookCopyIntoDB (req.params.id);
        sendSuccessResponse(res, {
          message: 'Book copy deleted successfully',
          statusCode: httpStatus.OK,
          data: result,
        });
      });

      getBookCopies = catchAsync(async (req, res) => {
        const result = await bookCopyService.getBookCopiesFromDB (req.params.bookId);
        sendSuccessResponse(res, {
          message: 'Book copy retrieved successfully',
          statusCode: httpStatus.OK,
          data: result,
        });
      });
}


export default new BookController()