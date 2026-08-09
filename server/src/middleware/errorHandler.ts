import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  errors?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors: any[] = err.errors || [];

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.errors || (err as any).keyPattern || {})[0] || "record";
    message = `A ${field} with this value already exists`;
  }

  // Mongoose CastError (Invalid ObjectId format)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for resource identifier`;
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError" && (err as any).errors) {
    statusCode = 422;
    message = "Database Validation Failed";
    errors = Object.values((err as any).errors).map((el: any) => ({
      field: el.path,
      message: el.message,
    }));
  }

  // JsonWebTokenError / TokenExpiredError
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token invalid or expired";
  }

  // Console log in non-test environments
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Express Error] ${req.method} ${req.url} - ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
};

export default errorHandler;
