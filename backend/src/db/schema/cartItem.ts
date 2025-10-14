import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { CartTable } from "./cart";
import { ProductTable } from "./product";

export const CartItemTable = pgTable("cartItem", {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cartId").references(() => CartTable.id).notNull(),
    productId: uuid("productId").references(() => ProductTable.id).notNull(),
    quantity: integer("quantity").default(1).notNull(),


})