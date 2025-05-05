import { IRouter, Router } from 'express';
import authRouter from '../modules/Auth/auth.route';
import departmentRouter from '../modules/Department/department.route';

type TModuleRoutes = { path: string; router: IRouter }[];
const router = Router();
const moduleRoutes: TModuleRoutes = [
  {
    path: '/auth',
    router: authRouter,
  },
  {
    path: '/departments',
    router: departmentRouter,
  },
];

const routes = moduleRoutes.map((route) => router.use(route.path, route.router));

export default routes;
