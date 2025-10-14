import { relations } from "drizzle-orm";
import {
  UserTable,
  AddressTable,
  CartTable,
  CartItemTable,
  CategoryTable,
  OrderTable,
  OrderItemTable,
  ProductTable,
} from "./tables";

export const UserRelations = relations(UserTable, ({ many, one }) => ({
  address: many(AddressTable),
  cart: one(CartTable),
  orders: many(OrderTable),
}));

export const AddresRelations = relations(AddressTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AddressTable.userId],
    references: [UserTable.id],
  }),
}));

export const CategoryRelations = relations(CategoryTable, ({ many }) => ({
  products: many(ProductTable),
}));

export const ProductRelations = relations(ProductTable, ({ one, many }) => ({
  category: one(CategoryTable, {
    fields: [ProductTable.categoryId],
    references: [CategoryTable.id],
  }),
  cartItems: many(CartItemTable),
  orderItems: many(OrderItemTable),
}));

export const CartRelations = relations(CartTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [CartTable.userId],
    references: [UserTable.id],
  }),
  items: many(CartItemTable),
}));

export const CartItemRelations = relations(CartItemTable, ({ one }) => ({
  cart: one(CartTable, {
    fields: [CartItemTable.cartId],
    references: [CartTable.id],
  }),
  product: one(ProductTable, {
    fields: [CartItemTable.productId],
    references: [ProductTable.id],
  }),
}));

export const OrderRelations = relations(OrderTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [OrderTable.userId],
    references: [UserTable.id],
  }),
  address: one(AddressTable, {
    fields: [OrderTable.addressId],
    references: [AddressTable.id],
  }),
  items: many(OrderItemTable),
}));

export const OrderItemRelations = relations(OrderItemTable, ({ one }) => ({
  order: one(OrderTable, {
    fields: [OrderItemTable.orderId],
    references: [OrderTable.id],
  }),
  product: one(ProductTable, {
    fields: [OrderItemTable.productId],
    references: [ProductTable.id],
  }),
}));
