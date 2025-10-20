import jwt, { Secret } from "jsonwebtoken";
import { userTable } from "../db/schema";
import { db } from "../db/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TOKEN_EXPIRY, TOKEN_SECRETS } from "../constants";

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.id, userId),
    });

    if (!user) throw new ApiError(404, "User not found");

    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.userRole },
      TOKEN_SECRETS.ACCESS_TOKEN,
      { expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN }
    );

    const refresh_token = jwt.sign(
      { id: user.id },
      TOKEN_SECRETS.REFRESH_TOKEN,
      { expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN }
    );

    await db
      .update(userTable)
      .set({ refreshToken: refresh_token })
      .where(eq(userTable.id, userId));

    return { access_token, refresh_token };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Token generation error:", error);
    throw new ApiError(500, "Error generating tokens");
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

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  ) as { id: string };

  await db
    .update(userTable)
    .set({ refreshToken: "" })
    .where(eq(userTable.id, decoded.id));

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { id: string };

      const [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, decodedToken.id));

      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
      }

      const { access_token, refresh_token: newRefreshToken } =
        await generateAccessAndRefreshTokens(user.id);

        await db
          .update(userTable)
          .set({ refreshToken: newRefreshToken,
            updatedAt: new Date()
           })
          .where(eq(userTable.id, user.id));

      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      };


      return res
        .status(200)
        .cookie("accessToken", access_token, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            { access_token, refreshToken: newRefreshToken },
            "Access token refreshed"
          )
        );
    } catch (err: any) {
      throw new ApiError(401, err?.message || "Invalid refresh token");
    }
  }
);

export const assigneRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) throw new ApiError(400, "Role is required");
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user) throw new ApiError(404, "User does not exist");

  await db
    .update(userTable)
    .set({ userRole: role })
    .where(eq(userTable.id, userId));

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role changed for the user"));
});

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
      );
  }
);
