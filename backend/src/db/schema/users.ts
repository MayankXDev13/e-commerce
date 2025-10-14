import {
  boolean,
  pgTable,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { UserLoginType, UserRole } from "./UserEnum";
import { timestamps } from "./columns.helpers";

export const UserTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull(),
    password: varchar("password", { length: 256 }).notNull(),
    avatar: varchar("avatar", { length: 256 }).notNull(),
    role: UserRole("userRole").default("BASIC").notNull(),
    loginType: UserLoginType("UserLoginType")
      .default("EMAIL_PASSWORD")
      .notNull(),
    isEmailVerified: boolean("isEmailVerified").default(false).notNull(),
    refreshToken: varchar("refreshToken", { length: 256 }).notNull(),
    forgotPasswordToken: varchar("forgotPasswordToken", {
      length: 256,
    }).notNull(),
    forgotPasswordExpiry: varchar("forgotPasswordExpiry", {
      length: 256,
    }).notNull(),
    emailVerificationToken: varchar("emailVerificationToken", {
      length: 256,
    }).notNull(),
    emailVerificationExpiry: varchar("emailVerificationExpiry", {
      length: 256,
    }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("email_idx").on(t.email),
    unique("unique_email").on(t.email),
  ]
);
