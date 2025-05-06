import AppError from '../../Errors/AppError';
import { generateSlug, objectId } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IPaginationOptions } from '../../types';
import {
  EAuthorStatus,
  ICreateAuthorPayload,
  IGetPublicAuthorsFilterPayload,
  IUpdateAuthorPayload,
} from './author.interface';
import Author from './author.model';

class AuthorService {
  async createAuthorIntoDB(payload: ICreateAuthorPayload) {
    let slug = generateSlug(payload.name);
    let count = 2;
    while (await Author.findOne({ slug })) {
      slug = generateSlug(`${payload.name} ${count}`);
    }
    return await Author.create({ ...payload, slug });
  }

  async updateAuthorIntoDB(id: string, payload: IUpdateAuthorPayload) {
    // Find the author by ID
    const author = await Author.findById(id);
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    // Initialize slug with the current one
    let slug = author.slug;

    // If the name is being changed, regenerate the slug
    if (payload.name && payload.name !== author.name) {
      slug = generateSlug(payload.name);
      let count = 2;

      // Ensure the new slug is unique
      while (await Author.findOne({ slug })) {
        slug = generateSlug(`${payload.name} ${count}`);
        count++;
      }
    }

    // Update the author with new data and slug
    return await Author.findByIdAndUpdate(
      id,
      {
        ...payload,
        slug,
      },
      { new: true }
    );
  }
  async changeAuthorStatusIntoDB(id: string, payload: { status: EAuthorStatus }) {
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EAuthorStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

    // Find the author
    const author = await Author.findById(id);
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    // Prevent status changes if the author is already deleted
    if (author.status === EAuthorStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Cannot change the status of a deleted author.');
    }

    // Perform the status update
    return await Author.findByIdAndUpdate(
      id,
      { status },
      { new: true } // return the updated document
    );
  }

  async softDeleteAuthorIntoDB(id: string) {
    // Find the author
    const author = await Author.findById(id);
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    // Prevent deleting an already deleted author
    if (author.status === EAuthorStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'This author is already deleted');
    }

    // Soft delete: Set the status to DELETED
    return await Author.findByIdAndUpdate(
      id,
      { status: EAuthorStatus.DELETED },
      { new: true } // return the updated document
    );
  }

  async getPublicAuthorByIdFromDB(id: string) {
    const author = await Author.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status !== EAuthorStatus.ACTIVE) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getAuthorByIdFromDB(id: string) {
    const author = await Author.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status === EAuthorStatus.DELETED) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getPublicAuthorsFromDB(
    filterPayload: IGetPublicAuthorsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: EAuthorStatus.ACTIVE,
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Author.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Author.countDocuments(whereConditions);

    const meta = {
      page,
      limit,
      totalResult,
    };

    return {
      data: authors,
      meta,
    };
  }

  async getAuthorsFromDB(
    filterPayload: IGetPublicAuthorsFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EAuthorStatus.DELETED,
      },
    };

    //  If searchTerm provided  then apply it
    if (searchTerm) {
      whereConditions.name = { $regex: searchTerm, $options: 'i' };
    }

    // If otherFilter (status) provided then applied it
    if (Object.values(otherFilters).length) {
      Object.entries(otherFilters).map(([key, value]) => {
        whereConditions[key] = value;
      });
    }

    // Fetch all matched  authors  with  pagination and sorting
    const authors = await Author.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Author.countDocuments(whereConditions);

    const total = await Author.countDocuments({
      status: {
        $ne: EAuthorStatus.DELETED,
      },
    });

    const meta = {
      page,
      limit,
      totalResult,
      total,
    };

    return {
      data: authors,
      meta,
    };
  }
}

export default new AuthorService();
