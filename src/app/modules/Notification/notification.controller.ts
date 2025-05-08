import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import notificationService from './notification.service';

class NotificationController {
  createNotification = catchAsync(async (req, res) => {
    const result = await notificationService.createNotificationIntoDB(req.body);
    sendSuccessResponse(res, {
      message: 'Notifications created   successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  getNotifications = catchAsync(async (req, res) => {
    const filterPayload = Pick(req.query, [
      'searchTerm',
      'userId',
      'status',
      'startDate',
      'endDate',
    ]);
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await notificationService.getNotificationsFromDB(
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Notifications retrieved   successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyNotifications = catchAsync(async (req, res) => {
    const result = await notificationService.getMyNotificationsFromDB(req.user);
    sendSuccessResponse(res, {
      message: 'Notifications retrieved   successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  setMyNotificationsAsRead = catchAsync(async (req, res) => {
    const result = await notificationService.setMyNotificationsAsReadIntoDB(req.user);
    sendSuccessResponse(res, {
      message: 'Notifications retrieved  successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new NotificationController();
