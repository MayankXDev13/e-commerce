// src/utils/ApiError.ts
import { errorHandler } from "../middlewares/error.middlewares";

/**
 * @description Common Error class to throw an error from anywhere.
 * The {@link errorHandler} middleware will catch this error at the central place
 * and it will return an appropriate response to the client.
 */
class ApiError extends Error {
  public statusCode: number;
  public data: any | null;
  public success: boolean;
  public errors: any[];

  /**
   * @param statusCode - HTTP status code of the error
   * @param message - Error message
   * @param errors - Array of detailed error objects or messages
   * @param stack - Optional custom stack trace
   */
  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack: string = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
