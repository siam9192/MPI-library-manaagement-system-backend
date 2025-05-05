import { ICreateAuthorPayload } from './author.interface';
import Author from './author.model';

const createAuthorIntoDB = async (payload: ICreateAuthorPayload) => {
  return await Author.create(payload);
};

const AuthorServices = {
  createAuthorIntoDB,
};

export default AuthorServices;
