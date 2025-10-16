import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserTable } from "../db/schema/users";
import { db } from "../db/db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  generateTemporaryToken,
  getLocalPath,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers";
import { eq, gt, and, ne } from "drizzle-orm";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { json } from "stream/consumers";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const genrateAccessAndRefreshToken = async (userId: string) => {
  try {
    // find the user
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, userId));

    if (!user) throw new ApiError(404, "User not found");

    // Genrating JWT token
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },

      REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await db
      .update(UserTable)
      .set({ refreshToken: refreshToken })
      .where(eq(UserTable.id, userId));

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const [existedUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email));

  if (existedUser) {
    throw new ApiError(400, "User with email or username already exists");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await db
    .insert(UserTable)
    .values({
      email: email,
      password: hashPassword,
    })
    .returning({
      id: UserTable.id,
      email: UserTable.email,
    });

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await db
    .update(UserTable)
    .set({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: new Date(tokenExpiry),
    })
    .where(eq(UserTable.id, user[0].id));

  await sendEmail({
    email: email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  const [createdUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.id, user[0].id));

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
        isEmailVerified: createdUser.isEmailVerified,
        avatar: createdUser.avatar,
      },
      "Users registered successfully and verification email has been sent on your email."
    )
  );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const [user] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, email));

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.loginType !== "EMAIL_PASSWORD") {
    throw new ApiError(
      400,
      "You have previously registered using " +
        user.loginType?.toLowerCase() +
        ". Please use the " +
        user.loginType?.toLowerCase() +
        " login option to access your account."
    );
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    user.id
  );

  const loggedInUser = await db
    .update(UserTable)
    .set({ refreshToken: refreshToken })
    .where(eq(UserTable.id, user.id))
    .returning({
      id: UserTable.id,
      email: UserTable.email,
      role: UserTable.role,
      isEmailVerified: UserTable.isEmailVerified,
      avatar: UserTable.avatar,
    });

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  await db
    .update(UserTable)
    .set({ refreshToken: "" })
    .where(eq(UserTable.id, req.user.id));

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "User logged out" });
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await db
    .select()
    .from(UserTable)
    .where(
      and(
        eq(UserTable.emailVerificationToken, hashedToken),
        gt(UserTable.emailVerificationExpiry, new Date())
      )
    );

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  await db.update(UserTable).set({
    isEmailVerified: true,
    emailVerificationExpiry: null,
    emailVerificationToken: null,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
});

const resendEmailVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, req.user?.id!));

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, "Email is already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();

    await db
      .update(UserTable)
      .set({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: new Date(tokenExpiry),
      })
      .where(eq(UserTable.id, user.id));

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/users/verify-email/${unHashedToken}`
      ),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Mail has been sent successfully"));
  }
);

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized resuest");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      REFRESH_TOKEN_SECRET
    ) as { id: string; email: string };

    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, decodedToken.id));

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await genrateAccessAndRefreshToken(user.id);

    await db
      .update(UserTable)
      .set({ refreshToken: newRefreshToken })
      .where(eq(UserTable.id, user.id));

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
