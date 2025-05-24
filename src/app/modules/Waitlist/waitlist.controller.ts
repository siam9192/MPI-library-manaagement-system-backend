import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import { sendSuccessResponse } from '../../utils/response';
import waitlistService from './waitlist.service';


class WaitlistController {
  addToWaitlist = catchAsync(async (req, res) => {
    const result = await waitlistService.addToWaitlist(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Borrow request successfully added on your waitlist!',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

 getMyWaitlistItemsFromDB = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await waitlistService.getMyWaitlistItemsFromDB(
      req.user,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Waitlist items  retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  removeItemFromWaitlist = catchAsync(async (req, res) => {
    const result = await waitlistService.removeFromWaitlist(
      req.user,
      req.params.id
    );
    sendSuccessResponse(res, {
      message: 'Item has been  successfully removed  from your waitlist',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new WaitlistController();
