
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import httpStatus from 'http-status';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error: any) {
    const errorMessage = error.errors.map((err: any) => err.message).join(', ');
    res.status(httpStatus.BAD_REQUEST).json({ error: errorMessage });
  }
};

export default validate;
