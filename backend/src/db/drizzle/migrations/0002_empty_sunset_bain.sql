ALTER TABLE "coupon" DROP CONSTRAINT "coupon_coupon_code_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "name_idx_category" ON "category" USING btree ("name");--> statement-breakpoint
CREATE INDEX "id_idx_category" ON "category" USING btree ("id");--> statement-breakpoint
CREATE INDEX "owner_idx_category" ON "category" USING btree ("owner");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_idx" ON "coupon" USING btree ("coupon_code");--> statement-breakpoint
CREATE INDEX "id_idx_product" ON "product" USING btree ("id");--> statement-breakpoint
CREATE INDEX "category_idx_product" ON "product" USING btree ("category");--> statement-breakpoint
CREATE INDEX "owner_idx_product" ON "product" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "name_idx_product" ON "product" USING btree ("name");--> statement-breakpoint
CREATE INDEX "description_idx_product" ON "product" USING btree ("description");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx_user" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx_user" ON "user" USING btree ("user_role");--> statement-breakpoint
CREATE INDEX "id_idx_user" ON "user" USING btree ("id");