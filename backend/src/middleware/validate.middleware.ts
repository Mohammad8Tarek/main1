import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error: any) {
    const errorMessage = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
    next(new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${errorMessage}`));
  }
};

export default validate;
