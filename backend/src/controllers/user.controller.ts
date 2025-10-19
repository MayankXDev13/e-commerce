import crypto from "crypto";
import jwt from "jsonwebtoken";
import { userTable } from "../db/schema";
import { db } from "../db/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";

const generateAccessAndRefreshTokens = async (userId: any) => {
  try {
    const user = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.id, userId),
    });

    const access_token = jwt.sign(
      {
        id: user?.id,
        email: user?.email,
        role: user?.userRole,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY || "3600"),
      }
    );

    const refresh_token = jwt.sign(
      {
        id: user?.id,
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY || "3600"),
      }
    );

    await db.update(userTable).set({
      refreshToken: refresh_token,
    });

    return { access_token, refresh_token };
  } catch (error: any) {
    throw new ApiError(
      500,
      "Something went wrong while genreating the access token"
    );
  }
};

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const existingUser = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.email, email.trim()),
    });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const [createdUser] = await db
      .insert(userTable)
      .values({
        email: email.trim(),
        password: hashedPassword,
      })
      .returning({
        id: userTable.id,
        email: userTable.email,
      });

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser },
          "User registered successfully"
        )
      );
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await db.query.userTable.findFirst({
    where: (user, { eq }) => eq(user.email, email.trim()),
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(password.trim(), user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { access_token, refresh_token } = await generateAccessAndRefreshTokens(
    user.id
  );

  const loggedInUser = await db.query.userTable.findFirst({
    where: (user, { eq }) => eq(user.id, user.id),
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", access_token, options)
    .cookie("refreshToken", refresh_token, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser: {
            id: loggedInUser?.id,
            email: loggedInUser?.email,
            role: loggedInUser?.userRole,
            refreshToken: loggedInUser?.refreshToken,
          },
          access_token,
          refresh_token,
        },
        "User logged in successfully"
      )
    );
});
