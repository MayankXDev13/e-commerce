import { db } from "../db/db";
import { cartTable, productTable, couponTable } from "../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export const getCart = async (userId: string) => {
  // Fetch the cart with coupon joined
  const cartResult = await db
    .select({
      cart: cartTable,
      coupon: couponTable,
    })
    .from(cartTable)
    .leftJoin(couponTable, eq(cartTable.coupon, couponTable.id))
    .where(eq(cartTable.owner, userId))
    .limit(1);

  // Return empty cart if not found or no items
  if (!cartResult.length || !cartResult[0].cart.items.length) {
    return {
      _id: null,
      items: [],
      coupon: null,
      cartTotal: 0,
      discountedTotal: 0,
    };
  }

  const { cart, coupon } = cartResult[0];

  // Extract product IDs from JSONB items array
  const productIds = cart.items.map((item) => item.productId);

  // Fetch all products using inArray operator
  const products = await db
    .select()
    .from(productTable)
    .where(inArray(productTable.id, productIds));

  // Create a product lookup map for O(1) access
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Build items array with product details and quantities
  const items = cart.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null; // Skip if product not found

      return {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          mainImageUrl: product.mainImageUrl,
          subImages: product.subImages,
          category: product.category,
          owner: product.owner,
        },
        quantity: item.quantity,
      };
    })
    .filter((item) => item !== null); // Remove null items

  // Calculate cart total
  const cartTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Calculate discounted total based on coupon
  let discountedTotal = cartTotal;

  if (coupon && coupon.isActive) {
    const now = new Date();
    const isValid =
      coupon.startDate <= now &&
      coupon.expiryDate >= now &&
      cartTotal >= (coupon.minimumCartValue || 0);

    if (isValid) {
      if (coupon.type === "FLAT") {
        discountedTotal = Math.max(0, cartTotal - coupon.discountValue);
      } else if (coupon.type === "PERCENTAGE") {
        discountedTotal = cartTotal - (cartTotal * coupon.discountValue) / 100;
      }
    }
  }

  return {
    _id: cart.id,
    items,
    coupon: coupon || null,
    cartTotal,
    discountedTotal,
  };
};

export const getUserCart = asyncHandler(async (req: Request, res: Response) => {
  let cart = await getCart(req.user?.id!);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

export const removeItemFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    // Check if product exists
    const product = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product.length) {
      throw new ApiError(404, "Product does not exist");
    }

    // Remove item from cart using PostgreSQL JSONB filtering
    await db
      .update(cartTable)
      .set({
        items: sql`(
        SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM jsonb_array_elements(${cartTable.items}) AS item
        WHERE item->>'productId' != ${productId}
      )`,
        updatedAt: new Date(),
      })
      .where(eq(cartTable.owner, req.user?.id!));

    let cart = await getCart(req.user?.id!);

    // Check if coupon is still valid based on minimum cart value
    if (cart.coupon && cart.cartTotal < (cart.coupon.minimumCartValue || 0)) {
      // Remove coupon if cart total is below minimum
      await db
        .update(cartTable)
        .set({
          coupon: null,
          updatedAt: new Date(),
        })
        .where(eq(cartTable.owner, req.user?.id!));

      // Fetch the latest cart after coupon removal
      cart = await getCart(req.user?.id!);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, cart, "Cart item removed successfully"));
  }
);

export const addItemOrUpdateItemQuantity = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    // Check if product exists
    const product = await db
      .select()
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product.length) {
      throw new ApiError(404, "Product does not exist");
    }

    // Validate stock
    if (quantity > product[0].stock) {
      throw new ApiError(
        400,
        product[0].stock > 0
          ? `Only ${product[0].stock} products are remaining. But you are adding ${quantity}`
          : "Product is out of stock"
      );
    }

    // Fetch user's cart
    const userCart = await db
      .select()
      .from(cartTable)
      .where(eq(cartTable.owner, req.user?.id!))
      .limit(1);

    if (!userCart.length) {
      throw new ApiError(404, "Cart not found");
    }

    const cart = userCart[0];

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    let updatedItems = [...cart.items];
    let shouldRemoveCoupon = false;

    if (existingItemIndex !== -1) {
      // Product exists - update quantity
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity,
      };
      // Remove coupon when updating existing item quantity
      shouldRemoveCoupon = cart.coupon !== null;
    } else {
      // Product doesn't exist - add new item
      updatedItems.push({
        id: crypto.randomUUID(), // Generate unique ID for the item
        productId,
        quantity,
      });
    }

    // Update cart
    await db
      .update(cartTable)
      .set({
        items: updatedItems,
        coupon: shouldRemoveCoupon ? null : cart.coupon,
        updatedAt: new Date(),
      })
      .where(eq(cartTable.owner, req.user?.id!));

    // Get structured cart with product details
    const newCart = await getCart(req.user?.id!);

    return res
      .status(200)
      .json(new ApiResponse(200, newCart, "Item added successfully"));
  }
);

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await db
    .update(cartTable)
    .set({
      items: [],
      coupon: null,
      updatedAt: new Date(),
    })
    .where(eq(cartTable.owner, req.user?.id!));

  const cart = await getCart(req.user?.id!);

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart has been cleared"));
});
