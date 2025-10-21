import { relations, sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** ENUMS **/
export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export const paymentProviderEnum = pgEnum("payment_provider", [
  "UNKNOWN",
  "RAZORPAY",
  "STRIPE",
  "PAYPAL",
  "COD",
]);
export const couponTypeEnum = pgEnum("coupon_type", ["FLAT", "PERCENTAGE"]);

export const userTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  avatar: varchar("avatar", { length: 256 }),
  userRole: roleEnum("user_role").notNull().default("USER"),
  refreshToken: varchar("refresh_token", { length: 256 }),
  forgotPasswordToken: varchar("forgot_password_token", { length: 256 }),
  forgotPasswordExpiry: timestamp("forgot_password_expiry", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categoryTable = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  owner: uuid("owner")
    .references(() => userTable.id)
    .notNull(), // One user → many categories
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const productTable = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: uuid("category")
    .references(() => categoryTable.id)
    .notNull(), // One category → many products
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  owner: uuid("owner")
    .references(() => userTable.id)
    .notNull(), // One user → many products
  price: real("price").notNull(),
  stock: real("stock").notNull(),
  mainImageUrl: varchar("main_image_url", { length: 256 }),
  mainImageLocalPath: varchar("main_image_local_path", {
    length: 255,
  }),
  subImages: jsonb("sub_images")
    .$type<{ id: string, url: string; localPath: string,   }[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const couponTable = pgTable("coupon", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  couponCode: varchar("coupon_code", { length: 256 }).notNull(),
  type: couponTypeEnum("type").default("FLAT").notNull(),
  discountValue: real("discount_value").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  minimumCartValue: real("minimum_cart_value").default(0),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  owner: uuid("owner")
    .references(() => userTable.id)
    .notNull(), // One user → many coupons
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cartTable = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  owner: uuid("owner")
    .references(() => userTable.id)
    .notNull()
    .unique(), // One user → one cart
  coupon: uuid("coupon_id").references(() => couponTable.id, {
    onDelete: "set null",
  }), // nullable
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cartProductTable = pgTable("cart_product", {
  cartId: uuid("cart_id")
    .references(() => cartTable.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => productTable.id)
    .notNull(),
  quantity: real("quantity").notNull(),
});

export const orderTable = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderPrice: real("order_price").notNull(),
  discountedOrderPrice: real("discounted_order_price").notNull(),
  customer: uuid("customer")
    .references(() => userTable.id)
    .notNull(), // Many orders → one user
  address: uuid("address_id")
    .references(() => addressTable.id)
    .notNull(),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  paymentProvider: paymentProviderEnum("payment_provider")
    .notNull()
    .default("UNKNOWN"),
  paymentId: varchar("payment_id", { length: 256 }),
  isPaymentDone: boolean("is_payment_done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orderProductTable = pgTable("order_product", {
  orderId: uuid("order_id")
    .references(() => orderTable.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => productTable.id)
    .notNull(),
  quantity: real("quantity").notNull(),
});

export const addressTable = pgTable("address", {
  id: uuid("id").primaryKey().defaultRandom(),
  addressLine1: varchar("address_line_1", { length: 256 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 256 }),
  city: varchar("city", { length: 256 }).notNull(),
  country: varchar("country", { length: 256 }).notNull(),
  state: varchar("state", { length: 256 }).notNull(),
  pincode: varchar("pincode", { length: 256 }).notNull(),
  owner: uuid("owner")
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations

export const userRelations = relations(userTable, ({ many, one }) => ({
  categoties: many(categoryTable), // user has many categories
  products: many(productTable), // user has many products
  orders: many(orderTable), // user has many orders
  coupons: many(couponTable), // user has many coupons
  addresses: many(addressTable), // user has many addresses

  cart: one(cartTable, {
    fields: [userTable.id],
    references: [cartTable.owner],
  }), // user has one cart
}));

export const categoryRelations = relations(categoryTable, ({ one, many }) => ({
  owner: one(userTable, {
    fields: [categoryTable.owner],
    references: [userTable.id],
  }),
  products: many(productTable), // category has many products
}));

export const productRelations = relations(productTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [productTable.category],
    references: [categoryTable.id],
  }),
  owner: one(userTable, {
    fields: [productTable.owner],
    references: [userTable.id],
  }),
}));

export const cartRelations = relations(cartTable, ({ one, many }) => ({
  owner: one(userTable, {
    fields: [cartTable.owner],
    references: [userTable.id],
  }),
  coupon: one(couponTable, {
    fields: [cartTable.coupon],
    references: [couponTable.id],
  }),
  products: many(cartProductTable), // join table
}));

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  customer: one(userTable, {
    fields: [orderTable.customer],
    references: [userTable.id],
  }),
  address: one(addressTable, {
    fields: [orderTable.address],
    references: [addressTable.id],
  }),
  products: many(orderProductTable), // join table
}));

export const cartProductRelations = relations(cartProductTable, ({ one }) => ({
  cart: one(cartTable, {
    fields: [cartProductTable.cartId],
    references: [cartTable.id],
  }),
  product: one(productTable, {
    fields: [cartProductTable.productId],
    references: [productTable.id],
  }),
}));

export const orderProductRelations = relations(
  orderProductTable,
  ({ one }) => ({
    order: one(orderTable, {
      fields: [orderProductTable.orderId],
      references: [orderTable.id],
    }),
    product: one(productTable, {
      fields: [orderProductTable.productId],
      references: [productTable.id],
    }),
  })
);
