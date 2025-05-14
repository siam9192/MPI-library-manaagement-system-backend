import { Router } from 'express';

import userController from './user.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from './user.interface';
import { administratorRoles, allRoles, managementRoles } from '../../utils/constant';

const router = Router();

router.get('/', userController.getUsers);
router.get('/students',auth(...managementRoles),userController.getStudents);

router.get('/librarians',auth(...administratorRoles), userController.getLibrarians);

router.get('/administrators',auth(...administratorRoles), userController.getAdministrators);

router.get('/me',auth(...allRoles),userController.getMe)
router.get('/:id',auth(...administratorRoles), userController.getUserById);

router.patch('/:id/status',auth(...administratorRoles), userController.changeUserStatus);

router.delete('/:id',auth(...administratorRoles), userController.softDeleteUser);

router.put('/my', auth(...Object.values(EUserRole)), userController.updateMyProfile);

const userRouter = router;

export default userRouter;
