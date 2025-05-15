import { z } from "zod";
import { isValidObjectId } from "../../helpers";

const createWishlistBook =  z.object({
    bookId:z.string({required_error:"bookId is required"}).refine(val=>isValidObjectId(val),{
        message:"Invalid bookId"
    })
})



export default {
    createWishlistBook
}