
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * @description Wraps async route handlers to catch errors and forward them to the global error handler.
 * 
 * @param requestHandler - The async Express route handler
 * @returns Wrapped function that automatically catches async errors
 */
const asyncHandler =
  (requestHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };

export { asyncHandler };
