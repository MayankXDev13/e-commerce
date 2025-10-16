import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { UserLoginType, UserRole } from "./enums";
import { timestamps } from "./columns.helpers";

export const UserTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull(),
    password: varchar("password", { length: 256 }).notNull(),
    avatar: varchar("avatar", { length: 256 }),
    role: UserRole("userRole").default("BASIC").notNull(),
    loginType: UserLoginType("UserLoginType")
      .default("EMAIL_PASSWORD")
      .notNull(),
    isEmailVerified: boolean("isEmailVerified").default(false),
    refreshToken: varchar("refreshToken", { length: 256 }),
    forgotPasswordToken: varchar("forgotPasswordToken", {
      length: 256,
    }),
    forgotPasswordExpiry: timestamp("forgotPasswordExpiry"),
    emailVerificationToken: varchar("emailVerificationToken", {
      length: 256,
    }),
    emailVerificationExpiry: timestamp("emailVerificationExpiry"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("email_idx").on(t.email),
    unique("unique_email").on(t.email),
  ]
);
