-- Add stock_type column
ALTER TABLE "public"."stocks" ADD COLUMN "stock_type" character varying(50) DEFAULT 'aluminium_stock' NOT NULL;

-- Drop old unique constraint
ALTER TABLE "public"."stocks" DROP CONSTRAINT IF EXISTS "unique_product_id";

-- Allow length to be nullable for hardware
ALTER TABLE "public"."stocks" ALTER COLUMN "length" DROP NOT NULL;

-- Add new unique constraint
CREATE UNIQUE INDEX "unique_product_id_idx" ON "public"."stocks" ("code", "stock_type", COALESCE("length", ''));
