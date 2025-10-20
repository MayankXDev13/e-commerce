import { Request } from "express";

export const getStaticFilePath = (req: Request, fileName: string): string => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

export const getLocalPath = (fileName: string) => {
  return `public/images/${fileName}`;
};



