import { Router } from 'express';
import rolePermissionController from './role-permission.controller';

const router = Router();

router.put('/:role', rolePermissionController.updateRolePermissions);

router.get('/', rolePermissionController.getAllRolePermissions);

router.get('/:role', rolePermissionController.getRolePermissions);

const rolePermissionRouter = router;

export default rolePermissionRouter;
