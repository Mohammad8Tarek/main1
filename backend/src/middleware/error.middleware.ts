import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import logger from '../utils/logger';
import config from '../config';
import httpStatus from 'http-status';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    if (config.env === 'production' && !err.isOperational) {
      message = 'Internal Server Error';
    }
  }

  res.locals.errorMessage = message;
  
  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  } else {
    if (statusCode >= 500) {
        logger.error(err);
    }
  }

  res.status(statusCode).send(response);
};
