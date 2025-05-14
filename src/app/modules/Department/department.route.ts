import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import departmentValidation from './department.validation';
import departmentController from './department.controller';
import auth from '../../middlewares/auth';
import { managementRoles } from '../../utils/constant';
const router = Router();

router.post(
  '/',
  auth(...managementRoles),
  validateRequest(departmentValidation.createDepartment),
  departmentController.createDepartment
);
router.put('/', auth(...managementRoles), validateRequest(departmentValidation.updateDepartment));
router.get('/', auth(...managementRoles), departmentController.getDepartments);
router.get('/:id', auth(...managementRoles), departmentController.getDepartmentById);

router.get('/public', departmentController.getPublicDepartments);
router.get('/public/:id', departmentController.getPublicDepartments);

const departmentRouter = router;

export default departmentRouter;
