import e, { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import wishlistValidation from "./wishlist.validation";
import wishlistController from "./wishlist.controller";
import auth from "../../middlewares/auth";
import { EUserRole } from "../User/user.interface";

const router = Router();



router.post('/',auth(EUserRole.STUDENT),validateRequest(wishlistValidation.createWishlistBook),wishlistController.createWishlistBook)

router.get('/my',auth(EUserRole.STUDENT),wishlistController.getMyWishlistBooks)
router.delete('/:id',auth(EUserRole.STUDENT),wishlistController.deleteWishlistBook)



const wishlistRouter = router

export default wishlistRouter