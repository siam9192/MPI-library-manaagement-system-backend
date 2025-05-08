import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import bookCopyValidation from "./book-copy.validation";
import bookCopyController from "./book-copy.controller";

const router = Router()


router.post("/",validateRequest(bookCopyValidation.createBookCopy),bookCopyController.createBookCopy)



router.put("/",validateRequest(bookCopyValidation.updateBookCopy),bookCopyController.updateBookCopy)



router.delete("/:id",bookCopyController.deleteBookCopy)


router.get("/book/:bookId",bookCopyController.getBookCopies)


const bookCopyRouter =  router


export default bookCopyRouter


