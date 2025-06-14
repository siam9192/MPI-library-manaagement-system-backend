import { ZodError } from 'zod';
import { TErrorInterface } from '../types/error.type';


export const HandleZodValidationError = (err: ZodError): TErrorInterface => {
  const statusCode = 400;
  const errorMessages = err.issues.map((issue) => {
    return {
      path: issue.path.at(-1) || '',
      message: issue.message,
    };
  });

  return {
    statusCode,
    message: err.message,
    errorMessages,
  };
};
