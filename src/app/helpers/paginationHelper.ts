import { IPaginationOptions } from '../types';
import { PAGINATION_OPTION_KEYS } from '../utils/constant';
import Pick from '../utils/pick';

export enum ESortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

interface IOptionsResult {
  page: number | undefined;
  limit: number | undefined;
  skip: number | undefined;
  sortOrder: ESortOrder | undefined;
  sortBy: string | undefined;
}

interface IDefaultOptions {
  defaultSortBy?: boolean;
  defaultSortOrder?: boolean;
  defaultPage?: boolean;
  defaultLimit?: boolean;
  limitOverride?: number;
}

export const calculatePagination = (
  paginationOptions: IPaginationOptions,
  options?: IDefaultOptions
): IOptionsResult => {
  // Parse pagination values with fallbacks
  let page: number | undefined = Number(paginationOptions.page) || 1;
  let limit: number | undefined = options?.limitOverride || Number(paginationOptions.limit) || 16;

  const isValidSortOrder = Object.values(ESortOrder).includes(
    paginationOptions.sortOrder as ESortOrder
  );
  let sortOrder: ESortOrder | undefined = isValidSortOrder
    ? (paginationOptions.sortOrder as ESortOrder)
    : ESortOrder.DESC;

  let sortBy: string | undefined = paginationOptions.sortBy || 'createdAt';

  let skip = (page - 1) * limit;

  // Override default behaviors if options are explicitly disabled
  if (options) {
    if (options.defaultSortBy === false && !paginationOptions.sortBy) {
      sortBy = undefined;
    }
    if (options.defaultSortOrder === false && !paginationOptions.sortOrder) {
      sortOrder = undefined;
    }
    if (options.defaultPage === false && !paginationOptions.page) {
      page = undefined;
    }
    if (options.defaultLimit === false && !paginationOptions.limit) {
      limit = undefined;
    }
  }

  return {
    page,
    limit,
    skip,
    sortOrder,
    sortBy,
  };
};

// Utility to pick pagination options from a query
export const paginationOptionPicker = (query: any) => Pick(query, PAGINATION_OPTION_KEYS);
