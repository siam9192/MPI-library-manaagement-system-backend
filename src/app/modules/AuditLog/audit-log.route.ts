import { Router } from 'express';
import auth from '../../middlewares/auth';
import { EUserRole } from '../User/user.interface';
import auditLogController from './audit-log.controller';

const router = Router();

router.get('/', auth(EUserRole.LIBRARIAN, EUserRole.ADMIN), auditLogController.getAuditLogs);

router.get('/:id', auth(EUserRole.LIBRARIAN, EUserRole.ADMIN), auditLogController.getAuditLogById);

const auditLogRouter = router;

export default auditLogRouter;
