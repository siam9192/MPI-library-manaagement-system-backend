import { Router } from "express";
import fineController from "./fine.controller";
import { EUserRole } from "../../type";
import auth from "../../middlewares/auth";
import { managementRoles } from "../../utils/constant";


const router = Router()

router.get('/', fineController.getFines);
router.get('/my', auth(EUserRole.STUDENT), fineController.getMyFines);
router.get('/:id', fineController.getFineById);
router.get('/my/:id', auth(EUserRole.STUDENT), fineController.getMyFineById);

router.patch('/:id/status',auth(...managementRoles),fineController.changeFineStatus)


const fineRouter  = router

export default fineRouter