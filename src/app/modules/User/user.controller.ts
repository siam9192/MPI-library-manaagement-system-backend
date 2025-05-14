import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import UserService from './user.service';

class UserController {

   getUsers = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['email', 'status','role']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await UserService.getUsersFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Users retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getStudents = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);

    const result = await UserService.getStudentsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Students retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getLibrarians = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);

    const result = await UserService.getLibrariansFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Librarians retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getAdministrators = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm', 'status']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await UserService.getAdministratorsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Administrator retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getUserById = catchAsync(async (req, res) => {
    const result = await UserService.getUserByIdFromDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'User retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  changeUserStatus = catchAsync(async (req, res) => {
    const result = await UserService.changeUserStatusIntoDB(req.params.id, req.body);
    sendSuccessResponse(res, {
      message: 'User status changed  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  softDeleteUser = catchAsync(async (req, res) => {
    const result = await UserService.softDeleteUserIntoDB(req.params.id);
    sendSuccessResponse(res, {
      message: 'User deleted  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  updateMyProfile = catchAsync(async (req, res) => {
    const result = await UserService.updateMyProfileIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Profile updated  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });


}

export default new UserController();
