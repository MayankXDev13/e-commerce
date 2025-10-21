ALTER TABLE "cart_product" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_product" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cart_product" CASCADE;--> statement-breakpoint
DROP TABLE "order_product" CASCADE;--> statement-breakpoint
ALTER TABLE "cart" DROP CONSTRAINT "cart_coupon_id_coupon_id_fk";
--> statement-breakpoint
ALTER TABLE "cart" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_coupon_code_unique" UNIQUE("coupon_code");