import { pgEnum } from "drizzle-orm/pg-core";

export const UserRole = pgEnum("userRole", ["ADMIN", "BASIC"])
export const UserLoginType = pgEnum("UserLoginType", ["GOOGLE", "GITHUB", "EMAIL_PASSWORD"])
