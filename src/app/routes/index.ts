import { IRouter, Router } from 'express';
import authRouter from '../modules/Auth/auth.route';
import departmentRouter from '../modules/Department/department.route';
import studentRegistrationRequestRouter from '../modules/StudentRegistrationRequest/student-registration-request.route';
import managementAccountRegistrationRequestRouter from '../modules/ManagementAccountRegistrationRequest/management-account-registration-request.route';
import authorRouter from '../modules/Author/author.route';
import followRouter from '../modules/Follow/follow.route';
import systemSettingRouter from '../modules/SystemSetting/system-setting.route';
import genreRouter from '../modules/Genre/genre.route';
import userRouter from '../modules/User/user.route';
import notificationRouter from '../modules/Notification/notification.route';
import bookRouter from '../modules/Book/book.route';
import bookCopyRouter from '../modules/BookCopy/book-copy.route';
import borrowRequestRouter from '../modules/BorrowRequest/borro-request.route';

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
    path: '/users',
    router: userRouter,
  },
  {
    path: '/departments',
    router: departmentRouter,
  },
  {
    path: '/authors',
    router: authorRouter,
  },
  {
    path: '/follows',
    router: followRouter,
  },
  {
    path: '/genres',
    router: genreRouter,
  },
  {
    path: '/books',
    router: bookRouter,
  },
  {
    path: '/book-copies',
    router: bookCopyRouter,
  },
  {
    path: '/borrow-requests',
    router: borrowRequestRouter,
  },
  {
    path: '/notifications',
    router: notificationRouter,
  },
  {
    path: '/system-settings',
    router: systemSettingRouter,
  },
];

const routes = moduleRoutes.map((route) => router.use(route.path, route.router));

export default routes;
