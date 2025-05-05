import { IPaginationOptions } from '../../types';
import { IGetDueFinesFilterData } from './fine.interface';

const getDueFinesFromDB = async (
  filterData: IGetDueFinesFilterData,
  paginationOptions: IPaginationOptions
) => {
  const { token, roll } = filterData;
};
