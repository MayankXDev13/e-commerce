import { categoryTable, productTable } from "../db/schema";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { count, eq, ne } from "drizzle-orm";
import { db } from "../db/db";
import { Request, Response } from "express";
import {
  getLocalPath,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers";
import fs from "fs/promises";
import { MAXIMUM_SUB_IMAGE_COUNT } from "../constants";
import { privateDecrypt, randomUUID } from "crypto";

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

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, category, price, stock } = req.body;

    if (!name?.trim()) {
      throw new ApiError(400, "Product name is required");
    }

    if (!category) {
      throw new ApiError(400, "Category is required");
    }

    if (!price || isNaN(parseFloat(price))) {
      throw new ApiError(400, "Valid price is required");
    }

    if (!req.user?.id) {
      throw new ApiError(401, "User not authenticated");
    }

    const categoryToBeAdded = await db
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.id, category));

    if (!categoryToBeAdded.length || !categoryToBeAdded[0]) {
      throw new ApiError(404, "Category does not exist");
    }

    if (!req.files?.mainImage || !req.files.mainImage.length) {
      throw new ApiError(400, "Main image is required");
    }

    const mainImageUrl = getStaticFilePath(
      req,
      req.files.mainImage[0].filename
    );
    const mainImageLocalPath = getLocalPath(req.files.mainImage[0].filename);

    const subImages =
      req.files.subImages && req.files.subImages.length
        ? req.files.subImages.map((image) => ({
            id: randomUUID(),
            url: getStaticFilePath(req, image.filename),
            localPath: getLocalPath(image.filename),
          }))
        : [];

    const owner = req.user.id;

    const product = await db
      .insert(productTable)
      .values({
        name: name.trim(),
        description: (description || "").trim(),
        category: category,
        price: parseFloat(price),
        stock: parseInt(stock || "0", 10),
        mainImageUrl: mainImageUrl,
        mainImageLocalPath: mainImageLocalPath,
        subImages: subImages,
        owner: owner,
      })
      .returning();

    return res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { name, description, category, price, stock } = req.body;

    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, productId));

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }

    const mainImage = req.files?.mainImage?.length
      ? {
          url: getStaticFilePath(req, req.files.mainImage[0].filename),
          localPath: getLocalPath(req.files.mainImage[0].filename),
        }
      : {
          url: product.mainImageUrl,
          localPath: product.mainImageLocalPath,
        };

    let subImages;

    if (req.files?.subImages && req.files.subImages.length) {
      if (req.files.subImages.length > MAXIMUM_SUB_IMAGE_COUNT) {
        req.files.subImages.forEach((image: any) =>
          removeLocalFile(getLocalPath(image.filename))
        );

        if (product.mainImageUrl !== mainImage.url) {
          removeLocalFile(mainImage.localPath);
        }

        throw new ApiError(
          400,
          `Maximum ${MAXIMUM_SUB_IMAGE_COUNT} sub images are allowed per product.`
        );
      }

      product.subImages.forEach((img: any) => {
        removeLocalFile(img.localPath);
      });

      subImages = req.files.subImages.map((image: any) => ({
        id: randomUUID(),
        url: getStaticFilePath(req, image.filename),
        localPath: getLocalPath(image.filename),
      }));
    } else {
      subImages = product.subImages;
    }

    const [updatedProduct] = await db
      .update(productTable)
      .set({
        name: name.trim(),
        description: (description || "").trim(),
        category: category,
        price: parseFloat(price),
        stock: parseInt(stock || "0", 10),
        mainImageUrl: mainImage.url,
        mainImageLocalPath: mainImage.localPath,
        subImages: subImages,
        updatedAt: new Date(),
      })
      .where(eq(productTable.id, productId))
      .returning();

    if (product.mainImageUrl !== mainImage.url) {
      removeLocalFile(product.mainImageLocalPath!);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  }
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, productId));

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
  }
);

export const getProductsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offSet = (pageNum - 1) * limitNum;

    const totalResult = await db
      .select({ count: count() })
      .from(productTable)
      .where(eq(productTable.category, categoryId));
    const total = totalResult[0].count;

    const data = await db
      .select()
      .from(productTable)
      .limit(limitNum)
      .offset(offSet)
      .where(eq(productTable.category, categoryId));

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
        "Product fetched successfully"
      )
    );
  }
);

export const removeProductSubImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, subImageId } = req.params;

    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, productId));

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }

    // Find the image to remove
    const removedSubImage = product.subImages?.find(
      (image) => image.id === subImageId
    );
    removeLocalFile(removedSubImage?.localPath!);

    // Filter out the image
    const updatedSubImages = product.subImages.filter(
      (image) => image.id !== subImageId
    );

    const updatedProduct = await db
      .update(productTable)
      .set({ subImages: updatedSubImages })
      .where(eq(productTable.id, productId))
      .returning();

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Sub image removed successfully")
      );
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const [product] = await db
      .delete(productTable)
      .where(eq(productTable.id, productId))
      .returning();

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }

    const imagePaths: string[] = [
      product.mainImageLocalPath,
      ...product.subImages.map((img) => img.localPath),
    ].filter((path): path is string => Boolean(path));

    imagePaths.forEach((path) => {
      removeLocalFile(path);
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedProduct: product },
          "Product deleted successfully"
        )
      );
  }
);
