import express, { NextFunction, Request, Response } from 'express';

import { sendErrorResponse } from './utils/response';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { GlobalErrorHandler } from './Errors/globalErrorHandler';
const app = express();
app.use(express.json());

app.use(cors({ credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', routes);

app.use(GlobalErrorHandler);

app.use((req, res) => {
  if (req.url === '/') {
    res.status(200).json({
      message: 'Hey welcome to  server',
    });
  }
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Not Found',
  });
});
export default app;
