import { z } from 'zod';
import { calculatePagination } from '../../helpers/paginationHelper';
import { IAuthUser, IPaginationOptions } from '../../types';
import { EFineStatus, IFinesFilterPayload } from './fine.interface';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import Fine from './fine.model';
import { objectId } from '../../helpers';

class FineService {
  async getFinesFromDB(filterPayload: IFinesFilterPayload, paginationOptions: IPaginationOptions) {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const { roll, status } = filterPayload;
    const whereConditions: any = {};

    // Check roll validation
    if (roll) {
      if (!z.number().int().safeParse(Number(roll)).success) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid roll number');
      }
      whereConditions['student.roll'] = Number(roll);
    }

    //  Check status validation
    if (status && !Object.values(EFineStatus).includes(status)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
    } else {
      whereConditions.status = status;
    }

    // Init variables
    let fines;
    let totalResult;

    if (roll) {
      fines = await Fine.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'student',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $unwind: '$student',
        },
        {
          $match: whereConditions,
        },
        {
          $lookup: {
            from: 'borrowrecords',
            localField: 'borrow',
            foreignField: '_id',
            as: 'borrow',
          },
        },
        {
          $unwind: '$borrow',
        },
        {
          $lookup: {
            from: 'books',
            localField: 'borrow.book',
            foreignField: '_id',
            as: 'book',
          },
        },
        {
          $unwind: '$book',
        },

        {
          $sort: {
            index: -1,
            [sortBy]: sortOrder,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      totalResult =
        (
          await Fine.aggregate([
            {
              $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'student',
              },
            },
            {
              $unwind: '$student',
            },

            {
              $match: whereConditions,
            },
            {
              $count: 'total',
            },
          ])
        )[0]?.total || 0;
    } else {
      fines = await Fine.find(whereConditions)
        .skip(skip)
        .limit(limit)
        .sort({
          index: -1,
          [sortBy]: sortOrder,
        })
        .populate([
          'student',
          {
            path: 'borrow',
            populate: 'book',
          },
        ]);
      totalResult = await Fine.countDocuments(whereConditions);
    }

    const total = await Fine.countDocuments();

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: fines,
      meta,
    };
  }
  async getMyFinesFromDB(authUser: IAuthUser, paginationOptions: IPaginationOptions) {
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    const whereConditions: any = {
      student: objectId(authUser.profileId),
    };
    const fines = await Fine.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({
        [sortBy]: sortOrder,
      })
      .populate([
        {
          path: 'borrow',
          populate: 'book',
        },
      ]);

    const totalResult = await Fine.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: fines,
      meta,
    };
  }
  async getFineById(id: string) {
    const fine = await Fine.findById(id).populate([
      'student',
      {
        path: 'borrow',
        populate: 'book',
      },
    ]);
    if (!fine) throw new AppError(httpStatus.NOT_FOUND, 'Borrow request not found');

    return fine;
  }
  async getMyFineById(authUser: IAuthUser, id: string) {
    const fine = await Fine.findOne({
      _id: objectId(id),
      student: objectId(authUser.profileId),
    }).populate({
      path: 'borrow',
      populate: 'book',
    });
    if (!fine) throw new AppError(httpStatus.NOT_FOUND, 'Borrow request not found');
    return fine;
  }
  async changeFineStatusIntoDB(id: string, payload: { status: EFineStatus }) {
    const { status } = payload;
    const fine = await Fine.findOne({ _id: objectId(id) });
    if (!fine) throw new AppError(httpStatus.NOT_FOUND, 'Fine  not found');
    if (fine.status === status) {
      throw new AppError(httpStatus.FORBIDDEN, `Fine is already ${status}`);
    }
    // Perform the status update
    return await Fine.findByIdAndUpdate(id, { status }, { new: true });
  }
  async waiveFineIntoDB(id: string) {
    const fine = await Fine.findOne({ _id: objectId(id) });
    if (!fine) throw new AppError(httpStatus.NOT_FOUND, 'Fine  not found');
    if (fine.status !== EFineStatus.UNPAID) {
      throw new AppError(httpStatus.FORBIDDEN, `Fine is already ${fine.status}`);
    }
    // Perform the status update
    return await Fine.findByIdAndUpdate(id, { status: EFineStatus.WAIVED }, { new: true });
  }
  async payFineIntoDB(id: string) {
    const fine = await Fine.findOne({ _id: objectId(id) });
    if (!fine) throw new AppError(httpStatus.NOT_FOUND, 'Fine not found');
    if (fine.status !== EFineStatus.UNPAID) {
      throw new AppError(httpStatus.FORBIDDEN, `Fine is already ${fine.status}`);
    }
    // Perform the status update
    return await Fine.findByIdAndUpdate(id, { status: EFineStatus.PAID }, { new: true });
  }
}

export default new FineService();
