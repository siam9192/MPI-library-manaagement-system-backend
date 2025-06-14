import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import departmentValidation from './department.validation';
import departmentController from './department.controller';
import auth from '../../middlewares/auth';
import { MANAGEMENT_ROLES } from '../../utils/constant';
const router = Router();

router.post(
  '/',
  auth(...MANAGEMENT_ROLES),
  validateRequest(departmentValidation.createDepartment),
  departmentController.createDepartment
);
router.put('/', auth(...MANAGEMENT_ROLES), validateRequest(departmentValidation.updateDepartment));

router.get('/public', departmentController.getPublicDepartments);
router.get('/public/:id', departmentController.getPublicDepartments);

router.get('/', auth(...MANAGEMENT_ROLES), departmentController.getDepartments);
router.get('/:id', auth(...MANAGEMENT_ROLES), departmentController.getDepartmentById);

const departmentRouter = router;

export default departmentRouter;
