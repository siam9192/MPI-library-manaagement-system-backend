import AppError from '../../Errors/AppError';
import httpStatus from '../../shared/http-status';
import { IPaginationOptions } from '../../types';
import { ICreateDepartmentPayload } from './department.interface';
import Department from './department.model';

const createDepartmentIntoDB = async (payload: ICreateDepartmentPayload) => {
  // Remove white space
  payload.name = payload.name.trim();
  payload.shortName = payload.shortName.trim();

  //   Checking department existence
  const department = await Department.findOne({
    $or: [
      {
        name: payload.name,
      },
      {
        shortName: payload.shortName,
      },
    ],
  });

  if (department) {
    if (department.name === payload.name) {
      throw new AppError(httpStatus.NOT_ACCEPTABLE, 'Department is already exist on this name');
    } else {
      throw new AppError(
        httpStatus.NOT_ACCEPTABLE,
        'Department is already exist on this short name'
      );
    }
  }
  return await Department.create(payload);
};

const getDepartmentsFromDBForManage = async (
  filterData: { searchTerm: string },
  paginationOptions: IPaginationOptions
) => {
  const whereConditions = {};
};

const DepartmentServices = {
  createDepartmentIntoDB,
  getDepartmentsFromDBForManage,
};

export default DepartmentServices;
