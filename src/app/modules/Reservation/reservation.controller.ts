import { paginationOptionPicker } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import catchAsync from '../../utils/catchAsync';
import Pick from '../../utils/pick';
import { sendSuccessResponse } from '../../utils/response';
import reservationService from './reservation.service';

class ReservationController {
  getReservations = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const filterPayload = Pick(req.query, ['secret', 'roll', 'status']);
    const result = await reservationService.getReservationsFromDB(filterPayload, paginationOptions);
    sendSuccessResponse(res, {
      message: 'Reservations retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });
  getMyReservations = catchAsync(async (req, res) => {
    const paginationOptions = paginationOptionPicker(req.query);
    const filterPayload = Pick(req.query, ['status']);
    const result = await reservationService.getMyReservationsFromDB(
      req.user,
      filterPayload,
      paginationOptions
    );
    sendSuccessResponse(res, {
      message: 'Reservations retrieved successfully',
      statusCode: httpStatus.OK,
      ...result,
    });
  });
  getReservationById = catchAsync(async (req, res) => {
    const result = await reservationService.getReservationById(req.params.id);
    sendSuccessResponse(res, {
      message: 'Reservation retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });

  getMyReservationById = catchAsync(async (req, res) => {
    const result = await reservationService.getMyReservationById(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Reservation retrieved successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  cancelReservation = catchAsync(async (req, res) => {
    const result = await reservationService.cancelReservation(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Reservation canceled successfully',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  checkoutReservation = catchAsync(async (req, res) => {
    const result = await reservationService.checkoutReservation(req.user, req.params.id);
    sendSuccessResponse(res, {
      message: 'Reservation checkout successful',
      statusCode: httpStatus.OK,
      data: result,
    });
  });
  getReservationQrCode = catchAsync(async (req, res) => {
    await reservationService.getReservationQrCode(req.params.id, res);
  });
}

export default new ReservationController();
