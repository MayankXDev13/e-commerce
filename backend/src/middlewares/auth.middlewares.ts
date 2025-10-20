import jwt from "jsonwebtoken";
import { userTable } from "../db/schema";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );

      const user = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.id, decodedToken.id),
      });

      if (!user) {
        throw new ApiError(401, "Invalid access token");
      }
      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, "Invalid access token");
    }
  }
);

export const getLoggedInUserOrIgnore = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    try {
      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );
      const user = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.id, decodedToken.id),
      });
      req.user = user;
      next();
    } catch (error) {
      next();
    }
  }
);

export const verifyPermission = (roles = []) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Unauthorized request");
    }
    if (roles.includes(req.user?.role)) {
      next();
    } else {
      throw new ApiError(403, "You are not allowed to perform this action");
    }
  });
