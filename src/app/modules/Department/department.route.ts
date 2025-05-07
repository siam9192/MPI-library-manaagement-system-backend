import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import departmentValidation from './department.validation';
import departmentController from './department.controller';
const router = Router();

router.post(
  '/',
  validateRequest(departmentValidation.createDepartment),
  departmentController.createDepartment
);
router.put('/', validateRequest(departmentValidation.updateDepartment));
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);

router.get('/public', departmentController.getPublicDepartments);
router.get('/public/:id', departmentController.getPublicDepartments);

const departmentRouter = router;

export default departmentRouter;
