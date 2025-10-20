import { Request, Response, NextFunction } from "express";
import logger from "../logger/winston.logger";
import { ApiError } from "../utils/ApiError";


/**
 * @description Global error handler middleware for Express.
 * Catches errors from async routes wrapped with {@link asyncHandler}.
 */
const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    // Native Error instance
    error = new ApiError(500, err.message, [], err.stack);
  } else {
    // Unknown type of error
    error = new ApiError(500, "Something went wrong");
  }

  // Log the error
logger.error("Error message:", error.message, "Errors:", Array.isArray(error.errors) ? error.errors : []);




  // Prepare response payload
  const responsePayload: Record<string, any> = {
    success: error.success,
    message: error.message,
    statusCode: error.statusCode,
    errors: error.errors,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(responsePayload);
};

export { errorHandler };
