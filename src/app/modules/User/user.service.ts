import { z } from 'zod';
import { calculatePagination } from '../../helpers/paginationHelper';
import { IAuthUser, IPaginationOptions } from '../../types';
import { Student } from '../Student/student.model';
import {
  EUserRole,
  EUserStatus,
  IRoleBaseUsersFilterPayload,
  IUserFiltersPayload,
  TUpdateMyProfilePayload,
} from './user.interface';
import { Types } from 'mongoose';
import { objectId } from '../../helpers';
import Librarian from '../Librarian/librarian.model';
import Administrator from '../Administrator/administrator.model';
import User from './user.model';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import userValidation from './user.validation';


class UserService {

  async getUsersFromDB (filterPayload:IUserFiltersPayload,paginationOptions:IPaginationOptions){

    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);
      const whereConditions: Record<string, any> = {
      status: {
        $ne: EUserStatus.DELETED,
      },
    };

    if (Object.values(filterPayload).length) {
      Object.entries(filterPayload).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }


     const users = await User.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await User.countDocuments(whereConditions);

    const total = await User.countDocuments({
      status: {
        $ne: EUserStatus.DELETED,
      },
    });

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: users,
      meta,
    };
  }

async getStudentsFromDB(
  filterPayload: IRoleBaseUsersFilterPayload,
  paginationOptions: IPaginationOptions
) {
  const { searchTerm, status, ...otherFilters } = filterPayload;
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Base filters (exclude deleted users)
  const whereConditions: Record<string, any> = {
    'user.status': { $ne: EUserStatus.DELETED },
  };

  // Handle search term
  if (searchTerm) {
    if (Types.ObjectId.isValid(searchTerm)) {
      whereConditions._id = new Types.ObjectId(searchTerm);
    } else if (z.number().int().safeParse(Number(searchTerm)).success) {
      whereConditions.roll = Number(searchTerm);
    } else {
      whereConditions.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { 'user.email': { $regex: searchTerm, $options: 'i' } },
      ];
    }
  }

  // Validate and apply user status
  if (status) {
    if (!z.enum([EUserStatus.ACTIVE, EUserStatus.BLOCKED]).safeParse(status).success) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
    }
    whereConditions['user.status'] = status;
  }

  // Apply any remaining filters
  for (const [key, value] of Object.entries(otherFilters)) {
    whereConditions[key] = value;
  }

  // Shared aggregation stages
  const baseStages = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

  ];

  // Students data pipeline
  const studentsPipeline = [
    ...baseStages,
    { $match: whereConditions },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
       {$project:{
      user:{
        password:false,
        permissions:false
      }
    }}
  ];

  // Count of filtered results
  const filteredCountPipeline = [
    ...baseStages,
    { $match: whereConditions },
    { $count: 'total' },
  ];

  // Total active students (regardless of filters)
  const totalCountPipeline = [
    ...baseStages,
    {
      $match: {
        'user.status': { $ne: EUserStatus.DELETED },
      },
    },
    { $count: 'total' },
  ];

  const [students, filteredCountResult, totalCountResult] = await Promise.all([
    Student.aggregate(studentsPipeline),
    Student.aggregate(filteredCountPipeline),
    Student.aggregate(totalCountPipeline),
  ]);

  const meta = {
    page,
    limit,
    totalResult: filteredCountResult[0]?.total || 0,
    total: totalCountResult[0]?.total || 0,
  };

  return {
    data: students,
    meta,
  };
}


  
async getLibrariansFromDB(
  filterPayload: IRoleBaseUsersFilterPayload,
  paginationOptions: IPaginationOptions
) {
  const { searchTerm, status, ...otherFilters } = filterPayload;
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Base filters (exclude deleted users)
  const whereConditions: Record<string, any> = {
    'user.status': { $ne: EUserStatus.DELETED },
  };

  // Handle search term
  if (searchTerm) {
    if (Types.ObjectId.isValid(searchTerm)) {
      whereConditions._id = new Types.ObjectId(searchTerm);
    } else {
      whereConditions.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { 'user.email': { $regex: searchTerm, $options: 'i' } },
      ];
    }
  }

  // Validate and apply user status
  if (status) {
    if (!z.enum([EUserStatus.ACTIVE, EUserStatus.BLOCKED]).safeParse(status).success) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
    }
    whereConditions['user.status'] = status;
  }

  // Apply any remaining filters
  for (const [key, value] of Object.entries(otherFilters)) {
    whereConditions[key] = value;
  }

  // Shared aggregation stages
  const baseStages = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  // Students data pipeline
  const studentsPipeline = [
    ...baseStages,
    { $match: whereConditions },
    
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
    {$project:{
      user:{
        password:false,
        permissions:false
      }
    }}
  ];

  // Count of filtered results
  const filteredCountPipeline = [
    ...baseStages,
    { $match: whereConditions },
    { $count: 'total' },
  ];

  // Total active students (regardless of filters)
  const totalCountPipeline = [
    ...baseStages,
    {
      $match: {
        'user.status': { $ne: EUserStatus.DELETED },
      },
    },
    { $count: 'total' },
  ];

  const [librarians, filteredCountResult, totalCountResult] = await Promise.all([
    Librarian.aggregate(studentsPipeline),
    Librarian.aggregate(filteredCountPipeline),
    Librarian.aggregate(totalCountPipeline),
  ]);

  const meta = {
    page,
    limit,
    totalResult: filteredCountResult[0]?.total || 0,
    total: totalCountResult[0]?.total || 0,
  };

  return {
    data: librarians,
    meta,
  };
}

  async getAdministratorsFromDB(
    filterPayload: IRoleBaseUsersFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, status, ...otherFilters } = filterPayload;
  const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

  // Base filters (exclude deleted users)
  const whereConditions: Record<string, any> = {
    'user.status': { $ne: EUserStatus.DELETED },
  };

  // Handle search term
  if (searchTerm) {
    if (Types.ObjectId.isValid(searchTerm)) {
      whereConditions._id = new Types.ObjectId(searchTerm);
    } else {
      whereConditions.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { 'user.email': { $regex: searchTerm, $options: 'i' } },
      ];
    }
  }

  // Validate and apply user status
  if (status) {
    if (!z.enum([EUserStatus.ACTIVE, EUserStatus.BLOCKED]).safeParse(status).success) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid status');
    }
    whereConditions['user.status'] = status;
  }

  // Apply any remaining filters
  for (const [key, value] of Object.entries(otherFilters)) {
    whereConditions[key] = value;
  }

  // Shared aggregation stages
  const baseStages = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  // Students data pipeline
  const studentsPipeline = [
    ...baseStages,
    { $match: whereConditions },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
       {$project:{
      user:{
        password:false,
        permissions:false
      }
    }},
  ];

  // Count of filtered results
  const filteredCountPipeline = [
    ...baseStages,
    { $match: whereConditions },
    { $count: 'total' },
  ];

  // Total active students (regardless of filters)
  const totalCountPipeline = [
    ...baseStages,
    {
      $match: {
        'user.status': { $ne: EUserStatus.DELETED },
      },
    },
    { $count: 'total' },
  ];

  const [administrator, filteredCountResult, totalCountResult] = await Promise.all([
    Administrator.aggregate(studentsPipeline),
    Administrator.aggregate(filteredCountPipeline),
    Administrator.aggregate(totalCountPipeline),
  ]);

  const meta = {
    page,
    limit,
    totalResult: filteredCountResult[0]?.total || 0,
    total: totalCountResult[0]?.total || 0,
  };

  return {
    data: administrator,
    meta,
  };
  }

  async getUserByIdFromDB(id: string) {
    const user = await User.findOne({ _id: objectId(id), status: { $ne: EUserStatus.DELETED } }).lean();

    // Check if user exist
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const role = user.role;

    let profile;
    if (role === EUserRole.STUDENT) {
      profile = await Student.findOne({
        user: user._id,
      });
    } else if (role === EUserRole.LIBRARIAN) {
      profile = await Librarian.findOne({
        user: user._id,
      });
    } else {
      profile = await Administrator.findOne({
        user: user._id,
      });
    }

    const data = {
      ...user,
      profile,
    };

    return data;
  }

  async changeUserStatusIntoDB(id: string, payload: { status: EUserStatus }) {
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EUserStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

    // Find the author
    const user = await User.findOne({ _id: objectId(id), status: EUserStatus.DELETED });
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Perform the status update
    return await User.findByIdAndUpdate(
      id,
      { status },
      { new: true } // return the updated document
    );
  }

  async softDeleteUserIntoDB(id: string) {
    // Find the author
    const user = await User.findById(id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Prevent deleting an already deleted author
    if (user.status === EUserStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'This author is already deleted');
    }

    // Soft delete: Set the status to DELETED
    return await User.findByIdAndUpdate(
      id,
      { status: EUserStatus.DELETED },
      { new: true } // return the updated document
    );
  }

  async updateMyProfileIntoDB(authUser: IAuthUser, payload: TUpdateMyProfilePayload) {
    const role = authUser.role;
    if (role === EUserRole.STUDENT) {
      userValidation.updateStudentProfile.parse(payload);

      return await Student.findByIdAndUpdate(authUser.profileId, payload, { new: true });
    } else if (role === EUserRole.LIBRARIAN) {
      userValidation.updateLibrarianProfile.parse(payload);
      return await Librarian.findByIdAndUpdate(authUser.profileId, payload, { new: true });
    } else {
      userValidation.updateAdministratorProfile.parse(payload);
      return await Administrator.findByIdAndUpdate(authUser.profileId, payload, { new: true });
    }
  }

 
}

export default new UserService();
