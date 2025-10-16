import { numeric, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { UserTable } from "./users";
import { timestamps } from "./columns.helpers";
import {PaymentMethod, OrderStatus} from "./enums"



export const OrderTable = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .references(() => UserTable.id)
    .notNull(),
  addressId: uuid("addressId")
    .references(() => UserTable.id)
    .notNull(),
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: OrderStatus().default("PENDING").notNull(),
  paymentMethod: PaymentMethod().default("COD").notNull(),
  ...timestamps,
});
