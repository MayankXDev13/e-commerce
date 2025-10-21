import { validationResult } from "express-validator";
import { errorHandler } from "../middlewares/error.middlewares.js";
import { ApiError } from "../utils/ApiError.js";
import { Request, Response, NextFunction } from "express";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: any = [];
  errors
    .array()
    .map((err: any) => extractedErrors.push({ [err.path]: err.msg }));

  // 422: Unprocessable Entity
  throw new ApiError(422, "Received data is not valid", extractedErrors);
};
