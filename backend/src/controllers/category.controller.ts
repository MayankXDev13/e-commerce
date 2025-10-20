import { json } from "stream/consumers";
import { db } from "../db/db";
import { categoryTable } from "../db/schema";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { count, eq, ne } from "drizzle-orm";

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name } = req.body;
   
    if (!name?.trim()) throw new Error("Name is required");
    if (!req.user?.id) throw new Error("Authentication required");

    const category = await db
      .insert(categoryTable)
      .values({ name: name.trim(), owner: req.user?.id })
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        owner: categoryTable.owner,
      });

    return res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  }
);

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offSet = (pageNum - 1) * limitNum;

    const totalResult = await db.select({ count: count() }).from(categoryTable);
    const total = totalResult[0].count;

    const data = await db
      .select()
      .from(categoryTable)
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
        "Categories fetched successfully"
      )
    );
  }
);

export const getCategoriesById = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    const category = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, categoryId));

    if (!category) {
      throw new ApiError(404, "Category does not exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, category, "Category fetched successfully"));
  }
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    const category = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, categoryId));

    if (!category) {
      throw new ApiError(404, "Category does not exist");
    }

    const updateCategory = await db
      .update(categoryTable)
      .set({ name: name.trim() })
      .where(eq(categoryTable.id, categoryId));

    return res
      .status(200)
      .json(
        new ApiResponse(200, updateCategory, "Category updated successfully")
      );
  }
);

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await db
    .delete(categoryTable)
    .where(eq(categoryTable.id, categoryId));

  if (!category) {
    throw new ApiError(404, "Category does not exist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCategory: category },
        "Category deleted successfully"
      )
    );
});
