import { pgTable, uuid } from "drizzle-orm/pg-core";
import { UserTable } from "./users";
import { timestamps } from "./columns.helpers";

export const CartTable = pgTable("cart", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => UserTable.id).notNull(),
    ...timestamps   
})
