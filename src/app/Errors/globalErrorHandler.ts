// eslint-disable no-unused-vars

import AppError from './AppError';
import { ZodError } from 'zod';
import { TErrorSource } from '../types/error.type';
import { HandleCastError } from './handleCastError';
import { HandleDuplicateError } from './handleDuplicateError';
import { HandleZodValidationError } from './handleZodValidationError';
import { HandleValidationError } from './handleValidationError';
import { config } from 'dotenv';
import envConfig from '../config/env.config';
import { EEnvironment } from '../types';
import { NextFunction, Response } from 'express';

export const GlobalErrorHandler: any = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorMessages: TErrorSource[] = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err?.name === 'CastError') {
    const errHandler = HandleCastError(err);
    statusCode = errHandler.statusCode;
    (message = errHandler.message), (errorMessages = errHandler.errorMessages);
  } else if (err?.code === 11000) {
    const errHandler = HandleDuplicateError(err);
    statusCode = errHandler?.statusCode;
    message = errHandler?.message;
    errorMessages = errHandler?.errorMessages;
  } else if (err instanceof ZodError) {
    const errHandler = HandleZodValidationError(err);
    statusCode = errHandler.statusCode;
    (message = errHandler.message), (errorMessages = errHandler.errorMessages);
  } else if (err?.name === 'ValidationError') {
    const errHandler = HandleValidationError(err);
    statusCode = errHandler.statusCode;
    (message = errHandler.message), (errorMessages = errHandler.errorMessages);
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorMessages = [
      {
        path: '',
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorMessages = [
      {
        path: '',
        message: err?.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: envConfig.environment === EEnvironment.Development ? err?.stack : null,
  });
};
