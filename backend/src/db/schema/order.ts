import { numeric, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { UserTable } from "./users";
import { timestamps } from "./columns.helpers";

export const order_status = pgEnum("order_status", [
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export const payment_method = pgEnum("payment_method", ["COD", "ONLINE"]);

export const OrderTable = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => UserTable.id)
    .notNull(),
  addressId: uuid("addressId")
    .references(() => UserTable.id)
    .notNull(),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: order_status("status").default("PENDING").notNull(),
  paymentMethod: payment_method("paymentMethod").default("COD").notNull(),
  ...timestamps,
});
