import AppError from '../../Errors/AppError';
import { generateSlug } from '../../helpers';
import httpStatus from '../../shared/http-status';
import { ICreateGenrePayload } from './genre.interface';
import Genre from './genre.model';
const createGenreIntoDB = async (payload: ICreateGenrePayload) => {
  // Generate initial slug from the genre name
  let slug = generateSlug(payload.name);

  // Check if the slug already exists in the database
  let counter = 1;
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
};

const getGenresFromDB = async () => {};

const getPopularGenresFromDB = async () => {};

const GenreServices = {
  createGenreIntoDB,
};

export default GenreServices;
