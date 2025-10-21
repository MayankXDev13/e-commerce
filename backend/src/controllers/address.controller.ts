import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { db } from "../db/db";
import { addressTable } from "../db/schema";
import { count, eq, ne } from "drizzle-orm";

export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    console.log(req.body);

    const { addressLine1, addressLine2, city, state, country, pincode } =
      req.body;

    if (
      !addressLine1 &&
      !addressLine2 &&
      !city &&
      !state &&
      !country &&
      !pincode
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const [address] = await db
      .insert(addressTable)
      .values({
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        owner: req.user?.id!,
      })
      .returning();

    return res
      .status(201)
      .json(new ApiResponse(201, address, "Address created successfully"));
  }
);

export const getAllAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offSet = (pageNum - 1) * limitNum;

    const totalResult = await db.select({ count: count() }).from(addressTable);
    const total = totalResult[0].count;

    const data = await db
      .select()
      .from(addressTable)
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
        "Addresses fetched successfully"
      )
    );
  }
);

export const getAddressById = asyncHandler(
  async (req: Request, res: Response) => {
    const { addressId } = req.params;

    const [address] = await db
      .select()
      .from(addressTable)
      .where(eq(addressTable.id, addressId));

    if (!address) {
      throw new ApiError(404, "Address does not exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, address, "Address fetched successfully"));
  }
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { addressId } = req.params;
    const { addressLine1, addressLine2, city, state, country, pincode } =
      req.body;

    if (
      !addressLine1 &&
      !addressLine2 &&
      !city &&
      !state &&
      !country &&
      !pincode
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const [address] = await db
      .select()
      .from(addressTable)
      .where(eq(addressTable.id, addressId));

    if (!address) {
      throw new ApiError(404, "Address does not exist");
    }

    const [updateAddress] = await db
      .update(addressTable)
      .set({
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        updatedAt: new Date(),
      })
      .where(eq(addressTable.id, address.id))
      .returning();

    return res
      .status(200)
      .json(
        new ApiResponse(200, updateAddress, "Address updated successfully")
      );
  }
);

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { addressId } = req.params;

    const [address] = await db
      .delete(addressTable)
      .where(eq(addressTable.id, addressId))
      .returning();

    if (!address) {
      throw new ApiError(404, "Address does not exist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedAddress: address },
          "Address deleted successfully"
        )
      );
  }
);
