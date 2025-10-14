import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { UserTable } from "./users";
import { timestamps } from "./columns.helpers";

export const AddressTable = pgTable("address", {
    id: uuid("id").primaryKey().defaultRandom(),
    // one user have multiple address
    userId: uuid("userId").references(() => UserTable.id).notNull(),
    addressLine1: varchar("addressLine1", { length: 256 }).notNull(),
    addressLine2: varchar("addressLine2", { length: 256 }).notNull(),
    city: varchar("city", { length: 256 }).notNull(),
    state: varchar("state", { length: 256 }).notNull(),
    postalCode: varchar("postalCode", { length: 256 }).notNull(),
    country: varchar("country", { length: 256 }).notNull(),
    ...timestamps
})