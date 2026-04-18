-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS "public"."orders_order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Add order_number column to orders table
ALTER TABLE "public"."orders" 
    ADD COLUMN IF NOT EXISTS "order_number" integer;

-- Associate sequence with column
ALTER SEQUENCE "public"."orders_order_number_seq" OWNED BY "public"."orders"."order_number";

-- Set default value for the column to use the sequence
ALTER TABLE ONLY "public"."orders" 
    ALTER COLUMN "order_number" SET DEFAULT "nextval"('"public"."orders_order_number_seq"'::"regclass");

-- Update existing orders with order numbers if they don't have one
UPDATE "public"."orders" 
    SET "order_number" = nextval('"public"."orders_order_number_seq"') 
    WHERE "order_number" IS NULL;

-- Make order_number NOT NULL after populating existing rows
ALTER TABLE "public"."orders" 
    ALTER COLUMN "order_number" SET NOT NULL;
