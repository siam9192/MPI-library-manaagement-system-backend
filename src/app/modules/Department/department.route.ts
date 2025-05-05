import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import departmentValidation from './department.validation';
import departmentController from './department.controller';
const router = Router();

router.post(
  '/',
  validateRequest(departmentValidation.CreateDepartment),
  departmentController.createDepartment
);

router.get('/', departmentController.getDepartments);
const departmentRouter = router;

export default departmentRouter;
