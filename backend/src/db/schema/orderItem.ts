import { pgTable, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { OrderTable } from "./order";
import { ProductTable } from "./product";

export const OrderItemTable = pgTable("orderItem", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("orderId")
    .references(() => OrderTable.id)
    .notNull(),
  productId: uuid("productId")
    .references(() => ProductTable.id)
    .notNull(),
  quantity: integer("quantity").default(1).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});
