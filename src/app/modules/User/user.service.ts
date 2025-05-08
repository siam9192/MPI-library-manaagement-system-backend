import { z } from 'zod';
import { calculatePagination } from '../../helpers/paginationHelper';
import { IPaginationOptions } from '../../types';
import { Student } from '../Student/student.model';
import { EUserRole, EUserStatus, IRoleBaseUsersFilterPayload } from './user.interface';
import { Types } from 'mongoose';
import { objectId } from '../../helpers';
import Librarian from '../Librarian/librarian.model';
import Administrator from '../Administrator/administrator.model';
import User from './user.model';
import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';

class UserService {

  
  async getStudentsFromDB(
    filterPayload: IRoleBaseUsersFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EUserStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    //  If searchTerm is a valid objectId then treat it as a _id
    //  If searchTerm is a valid number then treat it as a roll number
    if (searchTerm) {
      if (Types.ObjectId.isValid(searchTerm)) {
        whereConditions._id = objectId(searchTerm);
      } else if (z.number().int().safeParse(searchTerm).success) {
        whereConditions.roll = Number(searchTerm);
      } else {
        whereConditions.fullName = { $regex: searchTerm, $options: 'i' };
      }
    }
    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const students = await Student.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Student.countDocuments(whereConditions);

    const total = await Student.countDocuments({
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
      data: students,
      meta,
    };
  }

  async getLibrariansFromDB(
    filterPayload: IRoleBaseUsersFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EUserStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    //  If searchTerm is a valid objectId then treat it as a _id

    if (searchTerm) {
      if (Types.ObjectId.isValid(searchTerm)) {
        whereConditions._id = objectId(searchTerm);
      } else {
        whereConditions.fullName = { $regex: searchTerm, $options: 'i' };
      }
    }
    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const Librarians = await Librarian.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Librarian.countDocuments(whereConditions);

    const total = await Librarian.countDocuments({
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
      data: Librarians,
      meta,
    };
  }

  async getAdministratorsFromDB(
    filterPayload: IRoleBaseUsersFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm,status,...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EUserStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    //  If searchTerm is a valid objectId then treat it as a _id

    if (searchTerm) {
      if (Types.ObjectId.isValid(searchTerm)) {
        whereConditions._id = objectId(searchTerm);
      } else {
        whereConditions.fullName = { $regex: searchTerm, $options: 'i' };
      }
    }
    // If otherFilter (level) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const administrators = await Administrator.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Administrator.countDocuments(whereConditions);

    const total = await Administrator.countDocuments({
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
      data: administrators,
      meta,
    };
  }

  async getUserByIdFromDB(id: string) {
    const user = await User.findOne({ _id: objectId(id), status: { $ne: EUserStatus.DELETED } });

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

    const data =  {
        profile,
        userMetaData:user
    }
  }
 
  async changeUserStatusIntoDB (id:string,payload:{status:EUserStatus}){
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EUserStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

    // Find the author
    const user = await User.findOne({_id:objectId(id),status:EUserStatus.DELETED});
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


}

export default UserService
