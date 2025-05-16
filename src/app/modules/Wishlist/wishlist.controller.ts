import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import wishlistService from './wishlist.service';

class WishlistController {
  createWishlistBook = catchAsync(async (req, res) => {
    const result = await wishlistService.createWishlistBookIntoDB(req.user, req.body);
    sendSuccessResponse(res, {
      message: 'Wishlist book created  successfully',
      statusCode: httpStatus.CREATED,
      data: result,
    });
  });

  getMyWishlistBooks = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const result = await wishlistService.getMyWishlistBooksFromDB(req.user, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Wishlist books retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });
  deleteWishlistBook = catchAsync(async (req, res) => {
    const result = await wishlistService.deleteMyWishlistBookFromDB(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Book delete from wishlist successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
}

export default new WishlistController();
