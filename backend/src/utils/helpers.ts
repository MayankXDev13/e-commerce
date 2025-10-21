import { Request } from "express";
import logger from "../logger/winston.logger";
import fs from "fs/promises";
import { ApiError } from "./ApiError";

export const getStaticFilePath = (req: Request, fileName: string): string => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

export const getLocalPath = (fileName: string) => {
  return `public/images/${fileName}`;
};

export const removeLocalFile = async (localPath: string) => {
  try {
    await fs.unlink(localPath);
    logger.info(`Removing image file: ${localPath}`);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      logger.error("Error while removing local files: ", err);
    }
  }
};

export const removeUnusedMulterImageFilesOnError = async (req: Request) => {
  try {
    const multerFile = req.file;
    const multerFiles = req.files;

    if (multerFile) {
      logger.info(`Removing image file: ${multerFile.path}`);
      await removeLocalFile(multerFile.path);
    }

    if (multerFiles) {
      const filesValueArray = Object.values(multerFiles);
      const deletePromises = filesValueArray.flatMap((fileFields) =>
        fileFields.map((fileObject: any) => removeLocalFile(fileObject.path))
      );
      await Promise.all(deletePromises);
    }
  } catch (error) {
    logger.error("Error while removing image files: ", error);
  }
};
