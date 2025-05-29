import { Router } from 'express';
import statisticController from './statistic.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';
import { MANAGEMENT_ROLES } from '../../utils/constant';

const router = Router();

router.get('/global/summary',auth(EUserRole.SUPER_ADMIN,EUserRole.ADMIN), statisticController.getGlobalSummary);
router.get(
  '/librarian/summary',
  auth(EUserRole.LIBRARIAN),
  statisticController.getSummaryForLibrarian
);
router.get(
  '/student/activity/summary',
  auth(EUserRole.STUDENT),
  statisticController.getStudentActivitySummary
);
router.get(
  '/student/borrows/activity/monthly',
  auth(EUserRole.STUDENT),
  statisticController.getStudentMonthlyBorrowActivity
);

router.get('/books/summary', auth(...MANAGEMENT_ROLES), statisticController.getBooksSummary);

router.get(
  '/student-registrations/activity/monthly',
   auth(EUserRole.SUPER_ADMIN,EUserRole.ADMIN),
  statisticController.getMonthlyStudentRegistrationActivity
);

const statisticRouter = router;

export default statisticRouter;
