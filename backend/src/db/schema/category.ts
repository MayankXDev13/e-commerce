import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./columns.helpers";

export const CategoryTable = pgTable("category", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 256 }),
    ...timestamps
})