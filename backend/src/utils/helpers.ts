import fs from "fs";
import { Request } from "express";
import logger from "../logger/winston.logger.js";
import crypto from "crypto";
import { USER_TEMPORARY_TOKEN_EXPIRY } from "../constants.js";

/**
 * Extend Express Request to include Multer files
 */
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
}

/**
 * @description Utility function to include only specific keys in each object of an array.
 */
export const filterObjectKeys = <T extends Record<string, any>>(
  fieldsArray: (keyof T)[],
  objectArray: T[]
): Partial<T>[] => {
  return structuredClone(objectArray).map((originalObj) => {
    const obj = {} as Partial<T>;
    fieldsArray.forEach((field) => {
      if (field in originalObj) {
        obj[field] = originalObj[field];
      }
    });
    return Object.keys(obj).length > 0 ? obj : originalObj;
  });
};

/**
 * @description Provides paginated payload for array-based pagination.
 */
export const getPaginatedPayload = <T>(
  dataArray: T[],
  page: number,
  limit: number
) => {
  const startPosition = (page - 1) * limit;
  const totalItems = dataArray.length;
  const totalPages = Math.ceil(totalItems / limit);

  const paginatedData = structuredClone(dataArray).slice(
    startPosition,
    startPosition + limit
  );

  return {
    page,
    limit,
    totalPages,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
    totalItems,
    currentPageItems: paginatedData.length,
    data: paginatedData,
  };
};

/**
 * @description Returns the static file path served by Express.
 */
export const getStaticFilePath = (req: Request, fileName: string): string => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

/**
 * @description Returns the local filesystem path for an image file.
 */
export const getLocalPath = (fileName: string): string => {
  return `public/images/${fileName}`;
};

/**
 * @description Removes a file from the local filesystem.
 */
export const removeLocalFile = (localPath: string): void => {
  fs.unlink(localPath, (err) => {
    if (err) logger.error("Error while removing local files:", err);
    else logger.info("Removed local file:", localPath);
  });
};

export const removeUnusedMulterImageFilesOnError = (
  req: MulterRequest
): void => {
  try {
    if (req.file) {
      removeLocalFile(req.file.path);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        // Multiple files uploaded via .array('fieldname')
        req.files.forEach((file) => removeLocalFile(file.path));
      } else {
        // Multiple files uploaded via .fields([...])
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => removeLocalFile(file.path));
        });
      }
    }
  } catch (error) {
    logger.error("Error while removing image files:", error);
  }
};

/**
 * @description Simple random number generator (0 ≤ n < max)
 */
export const getRandomNumber = (max: number): number => {
  return Math.floor(Math.random() * max);
};

/**
 * @description Generate SQL-style pagination config for Drizzle ORM.
 */
export const getDrizzlePagination = ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(limit, 1);

  return {
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
};

export const generateTemporaryToken = () => {
  const unHashedToken = crypto.randomBytes(20).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  const tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString();;
  return { unHashedToken, hashedToken, tokenExpiry };
};
