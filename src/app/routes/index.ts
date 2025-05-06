import { IRouter, Router } from 'express';
import authRouter from '../modules/Auth/auth.route';
import departmentRouter from '../modules/Department/department.route';
import studentRegistrationRequestRouter from '../modules/StudentRegistrationRequest/student-registration-request.route';
import managementAccountRegistrationRequestRouter from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.route';
import authorRouter from '../modules/Author/author.route';

type TModuleRoutes = { path: string; router: IRouter }[];
const router = Router();
const moduleRoutes: TModuleRoutes = [
  {
    path: '/auth',
    router: authRouter,
  },
  {
    path: '/student-registration-requests',
    router: studentRegistrationRequestRouter,
  },
  {
    path: '/management-registration-requests',
    router: managementAccountRegistrationRequestRouter,
  },
  {
    path: '/departments',
    router: departmentRouter,
  },
  {
    path: '/authors',
    router: authorRouter,
  },
];

const routes = moduleRoutes.map((route) => router.use(route.path, route.router));

export default routes;
