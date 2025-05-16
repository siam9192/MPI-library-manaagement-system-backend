import { Router } from "express";
import auth from "../../middlewares/auth";
import { EUserRole } from "../User/user.interface";
import borrowHistoryController from "./borrow-history.controller";

const router =  Router()


router.get('/my',auth(EUserRole.STUDENT),borrowHistoryController.getMyBorrowHistories);


router.get('/my/id',auth(EUserRole.STUDENT),borrowHistoryController.getMyBorrowHistoryById)



const borrowHistoryRouter =  router;
export default borrowHistoryRouter;



