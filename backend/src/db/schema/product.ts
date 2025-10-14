import { integer, numeric, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { CategoryTable } from "./category";
import { timestamps } from "./columns.helpers";

export const ProductTable = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 256 }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  categoryId: uuid("categoryId").references(() => CategoryTable.id).notNull(),
  imageUrl: varchar("imageUrl", { length: 256 }).notNull(),
  ...timestamps
});
