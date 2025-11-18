
class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      // FIX: Cast Error to any to access captureStackTrace, a V8-specific method not in standard ES types.
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;