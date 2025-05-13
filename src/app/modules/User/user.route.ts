import { Router } from 'express';

import userController from './user.controller';
import auth from '../../middlewares/auth';
import { EUserRole } from './user.interface';

const router = Router();

router.get('/students', userController.getStudents);

router.get('/librarians', userController.getLibrarians);

router.get('/administrators', userController.getAdministrators);

router.get('/:id',userController.getUserById)

router.patch('/:id/status', userController.changeUserStatus);

router.delete('/:id', userController.softDeleteUser);

router.put('/my', auth(...Object.values(EUserRole)), userController.updateMyProfile);

router.put('/:id/permissions', userController.updateUserPermissions);

const userRouter = router;

export default userRouter;
