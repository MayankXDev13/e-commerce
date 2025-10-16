import { pgEnum } from "drizzle-orm/pg-core";

export const UserRole = pgEnum("user_role", ["ADMIN", "BASIC"]);
export const UserLoginType = pgEnum("user_login_type", ["GOOGLE", "GITHUB", "EMAIL_PASSWORD"]);
export const OrderStatus = pgEnum("order_status", ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]);
export const PaymentMethod = pgEnum("payment_method", ["COD", "ONLINE"]);
