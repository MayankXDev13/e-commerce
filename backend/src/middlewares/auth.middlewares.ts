import jwt from "jsonwebtoken";
import { userTable } from "../db/schema";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";
import logger from "../logger/winston.logger";

interface DecodedToken {
  id: string;
  email: string;
}

type User = {
  id: string;
  email: string;
  password: string;
  avatar: string | null;
  userRole: "ADMIN" | "USER";
  refreshToken: string | null;
  forgotPasswordToken: string | null;
  forgotPasswordExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as DecodedToken;

      if (!decodedToken?.id) {
        throw new ApiError(401, "Invalid access token");
      }

      const user = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.id, decodedToken.id),
      });

      if (!user) {
        throw new ApiError(401, "User not found");
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, "Invalid access token");
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, "Access token has expired");
      }

      throw new ApiError(401, "Authentication failed");
    }
  }
);

export const getLoggedInUserOrIgnore = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return next();
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as DecodedToken;

      if (!decodedToken?.id) {
        return next();
      }

      const user = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.id, decodedToken.id),
      });

      if (user) {
        req.user = user;
      }

      next();
    } catch (error) {
      next();
    }
  }
);

export const verifyPermission = (roles: string[] = []) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (roles.length === 0) {
      return next();
    }

    if (!roles.includes(req.user?.userRole)) {
      throw new ApiError(403, "You are not allowed to perform this action");
    }

    next();
  });
