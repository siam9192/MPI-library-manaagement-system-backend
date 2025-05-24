import { Router } from 'express';

import userController from './user.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from './user.interface';
import { ADMINISTRATOR_ROLES, ALL_ROLES, MANAGEMENT_ROLES } from '../../utils/constant';

const router = Router();

router.get('/', userController.getUsers);
router.get('/students', auth(...MANAGEMENT_ROLES), userController.getStudents);

router.get('/librarians', auth(...ADMINISTRATOR_ROLES), userController.getLibrarians);

router.get('/administrators', auth(...ADMINISTRATOR_ROLES), userController.getAdministrators);

router.get('/me', auth(...ALL_ROLES), userController.getMe);
router.get('/:id', auth(...ADMINISTRATOR_ROLES), userController.getUserById);

router.patch('/:id/status', auth(...ADMINISTRATOR_ROLES), userController.changeUserStatus);

router.delete('/:id', auth(...ADMINISTRATOR_ROLES), userController.softDeleteUser);

router.put('/my', auth(...Object.values(EUserRole)), userController.updateMyProfile);

const userRouter = router;

export default userRouter;
