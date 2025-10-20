import { categoryTable, productTable } from "../db/schema";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { count, eq } from "drizzle-orm";
import { db } from "../db/db";
import { Request, Response } from "express";
import { getLocalPath, getStaticFilePath } from "../utils/helpers";
import { unlink } from "fs/promises";

export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offSet = (pageNum - 1) * limitNum;

    const totalResult = await db.select({ count: count() }).from(productTable);
    const total = totalResult[0].count;

    const data = await db
      .select()
      .from(productTable)
      .limit(limitNum)
      .offset(offSet);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
        "Products fetched successfully"
      )
    );
  }
);

