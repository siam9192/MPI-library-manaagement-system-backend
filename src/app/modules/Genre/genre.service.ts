import AppError from '../../Errors/AppError';
import { generateSlug } from '../../helpers';
import { calculatePagination } from '../../helpers/paginationHelper';
import httpStatus from '../../shared/http-status';
import { IPaginationOptions } from '../../types';
import {
  EGenreStatus,
  ICreateGenrePayload,
  IGenresFilterPayload,
  IGenreUpdatePayload,
  IPublicGenresFilterPayload,
} from './genre.interface';
import Genre from './genre.model';

class GenreService {
  async createGenreIntoDB(payload: ICreateGenrePayload) {
    // Generate initial slug from the genre name
    let slug = generateSlug(payload.name);

    // Check if the slug already exists in the database
    let counter = 2;
    while (await Genre.findOne({ slug })) {
      // If it exists, append a counter to make the slug unique
      slug = generateSlug(payload.name + ' ' + counter);
      counter++;
    }

    // Attempt to create the genre in the database
    const createdGenre = await Genre.create({ ...payload, slug });

    // Throw an error if creation failed
    if (!createdGenre) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Genre cannot be created. Something went wrong!'
      );
    }

    // Return the created genre (you were returning null earlier — assuming that was a mistake)
    return createdGenre;
  }

  async updateGenreIntoDB(id: string, payload: IGenreUpdatePayload) {
    // Find the author by ID
    const genre = await Genre.findById(id);
    if (!genre) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    // Initialize slug with the current one
    let slug = genre.slug;

    // If the name is being changed, regenerate the slug
    if (payload.name && payload.name !== genre.name) {
      slug = generateSlug(payload.name);
      let count = 2;

      // Ensure the new slug is unique
      while (await Genre.findOne({ slug })) {
        slug = generateSlug(`${payload.name} ${count}`);
        count++;
      }
    }

    // Update the author with new data and slug
    return await Genre.findByIdAndUpdate(
      id,
      {
        ...payload,
        slug,
      },
      { new: true }
    );
  }
  async changeGenreStatusIntoDB(id: string, payload: { status: EGenreStatus }) {
    const { status } = payload;
    // Prevent setting status to DELETED via this method
    if (status === EGenreStatus.DELETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot set status to 'deleted' using this method."
      );
    }

    // Find the author
    const author = await Genre.findById(id);
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    // Prevent status changes if the author is already deleted
    if (author.status === EGenreStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'Cannot change the status of a deleted genre.');
    }

    // Perform the status update
    return await Genre.findByIdAndUpdate(
      id,
      { status },
      { new: true } // return the updated document
    );
  }

  async softDeleteGenreIntoDB(id: string) {
    // Find the author
    const author = await Genre.findById(id);
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    // Prevent deleting an already deleted author
    if (author.status === EGenreStatus.DELETED) {
      throw new AppError(httpStatus.FORBIDDEN, 'This Genre is already deleted');
    }

    // Soft delete: Set the status to DELETED
    return await Genre.findByIdAndUpdate(
      id,
      { status: EGenreStatus.DELETED },
      { new: true } // return the updated document
    );
  }

  async getPublicGenreByIdFromDB(id: string) {
    const author = await Genre.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Genre not found');
    }

    if (author.status !== EGenreStatus.ACTIVE) {
      throw new AppError(httpStatus.NOT_FOUND, 'This genre is no longer available');
    }

    return author;
  }

  async getGenreByIdFromDB(id: string) {
    const author = await Genre.findById(id);
    //  Check if author exist
    if (!author) {
      throw new AppError(httpStatus.NOT_FOUND, 'Author not found');
    }

    if (author.status === EGenreStatus.DELETED) {
      throw new AppError(httpStatus.NOT_FOUND, 'This author is no longer available');
    }

    return author;
  }

  async getPublicGenresFromDB(
    filterPayload: IPublicGenresFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: EGenreStatus.ACTIVE,
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
    const authors = await Genre.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Genre.countDocuments(whereConditions);

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

  async getGenresFromDB(
    filterPayload: IGenresFilterPayload,
    paginationOptions: IPaginationOptions
  ) {
    const { searchTerm, ...otherFilters } = filterPayload;
    const { page, skip, limit, sortBy, sortOrder } = calculatePagination(paginationOptions);

    //  Initialize filter with active status
    const whereConditions: Record<string, any> = {
      status: {
        $ne: EGenreStatus.DELETED,
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
    const authors = await Genre.find(whereConditions)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalResult = await Genre.countDocuments(whereConditions);

    const total = await Genre.countDocuments({
      status: {
        $ne: EGenreStatus.DELETED,
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

export default new GenreService();
