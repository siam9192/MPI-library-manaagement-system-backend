import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import followService from './follow.service';

class FollowController {
  createFollow = catchAsync(async (req, res) => {
    const result = await followService.createFollowIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Follow created successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  deleteFollow = catchAsync(async (req, res) => {
    const result = await followService.deleteFollowFromDB(req.user, req.params.authorId);
    sendSuccessResponse(res, {
      message: 'Follow deleted successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMineFollows = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await followService.getMineFollowsFromDB(
      req.user,
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Follows retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getAuthorFollowers = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, ['searchTerm']);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await followService.getAuthorFollowersFromDB(
      req.params.authorId,
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Followers retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });

  getFollowStatus = catchAsync(async (req, res) => {
    const result = await followService.getFollowStatus(req.user, req.params.authorId);
    sendSuccessResponse(res, {
      message: 'Follow status retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new FollowController();
