


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."log_stock_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only log if quantity actually changed
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO stock_history (
            stock_id,
            type,
            quantity_change,
            quantity_before,
            quantity_after,
            notes
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.quantity > OLD.quantity THEN 'ADD'
                WHEN NEW.quantity < OLD.quantity THEN 'SELL'
                ELSE 'ADJUST'
            END,
            NEW.quantity - OLD.quantity,
            OLD.quantity,
            NEW.quantity,
            'Automatic stock update'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_stock_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_totals"("order_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    items_total DECIMAL(12,2) := 0;
    gst_total DECIMAL(12,2) := 0;
    raw_final_total DECIMAL(12,2) := 0;
    rounded_final_total DECIMAL(12,2) := 0;
    rounding_diff DECIMAL(12,2) := 0;
    order_record RECORD;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate items subtotal based on weight * price_per_piece * pieces
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN weight IS NOT NULL THEN weight * pieces_used * price_per_piece
                ELSE pieces_used * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM order_items 
    WHERE order_id = order_uuid;
    
    -- Update individual item subtotals
    UPDATE order_items SET
        subtotal = CASE 
            WHEN weight IS NOT NULL THEN weight * pieces_used * price_per_piece
            ELSE pieces_used * price_per_piece
        END
    WHERE order_id = order_uuid;
    
    -- Calculate GST if enabled
    IF order_record.gst_enabled THEN
        gst_total := items_total * (order_record.gst_percentage / 100);
    END IF;
    
    -- Calculate raw final total
    raw_final_total := items_total + gst_total;
    
    -- Apply rounding logic
    rounded_final_total := CASE 
        WHEN raw_final_total % 1 >= 0.5 THEN CEIL(raw_final_total)
        ELSE FLOOR(raw_final_total)
    END;
    
    -- Calculate rounding adjustment
    rounding_diff := rounded_final_total - raw_final_total;
    
    -- Update order with calculated totals
    UPDATE orders SET
        subtotal = items_total,
        gst_amount = gst_total,
        raw_total = raw_final_total,
        total_amount = rounded_final_total,
        rounding_adjustment = rounding_diff
    WHERE id = order_uuid;
END;
$function$;

-- Update order_items calculation logic in update_order_totals
CREATE OR REPLACE FUNCTION public.update_order_totals(order_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    items_total DECIMAL(12,2) := 0;
    gst_total DECIMAL(12,2) := 0;
    raw_final_total DECIMAL(12,2) := 0;
    rounded_final_total DECIMAL(12,2) := 0;
    rounding_diff DECIMAL(12,2) := 0;
    order_record RECORD;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate items subtotal
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN rate_type = 'per_kg' THEN
                    COALESCE(manual_net_weight, weight * pieces_used, 0) * price_per_piece
                ELSE pieces_used * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM order_items 
    WHERE order_id = order_uuid;
    
    -- Update individual item subtotals
    UPDATE order_items SET
        subtotal = CASE 
            WHEN rate_type = 'per_kg' THEN
                COALESCE(manual_net_weight, weight * pieces_used, 0) * price_per_piece
            ELSE pieces_used * price_per_piece
        END
    WHERE order_id = order_uuid;
    
    -- Calculate GST if enabled
    IF order_record.gst_enabled THEN
        gst_total := items_total * (order_record.gst_percentage / 100);
    END IF;
    
    -- Calculate raw final total
    raw_final_total := items_total + gst_total;
    
    -- Apply rounding logic
    rounded_final_total := CASE 
        WHEN raw_final_total % 1 >= 0.5 THEN CEIL(raw_final_total)
        ELSE FLOOR(raw_final_total)
    END;
    
    -- Calculate rounding adjustment
    rounding_diff := rounded_final_total - raw_final_total;
    
    -- Update order with calculated totals
    UPDATE orders SET
        subtotal = items_total,
        gst_amount = gst_total,
        raw_total = raw_final_total,
        total_amount = rounded_final_total,
        rounding_adjustment = rounding_diff
    WHERE id = order_uuid;
END;
$function$;


ALTER FUNCTION "public"."update_order_totals"("order_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_quotation_totals"("quotation_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    items_total DECIMAL(12,2) := 0;
    additional_total DECIMAL(12,2) := 0;
    gst_total DECIMAL(12,2) := 0;
    raw_final_total DECIMAL(12,2) := 0;
    rounded_final_total DECIMAL(12,2) := 0;
    rounding_diff DECIMAL(12,2) := 0;
    quotation_record RECORD;
BEGIN
    -- Get quotation details
    SELECT * INTO quotation_record FROM quotations WHERE id = quotation_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate items subtotal based on weight * price_per_piece * pieces
    -- If weight is NULL, fall back to price_per_piece * pieces
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN weight IS NOT NULL THEN weight * pieces * price_per_piece
                ELSE pieces * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM quotation_items 
    WHERE quotation_id = quotation_uuid;
    
    -- Update individual item subtotals with the same logic
    UPDATE quotation_items SET
        subtotal = CASE 
            WHEN weight IS NOT NULL THEN weight * pieces * price_per_piece
            ELSE pieces * price_per_piece
        END
    WHERE quotation_id = quotation_uuid;
    
    -- Calculate additional costs total
    SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0) 
    INTO additional_total
    FROM quotation_additional_costs 
    WHERE quotation_id = quotation_uuid;
    
    -- Calculate GST if enabled
    IF quotation_record.gst_enabled THEN
        gst_total := (items_total + additional_total) * (quotation_record.gst_percentage / 100);
    END IF;
    
    -- Calculate raw final total
    raw_final_total := items_total + additional_total + gst_total;
    
    -- Apply rounding logic
    rounded_final_total := CASE 
        WHEN raw_final_total % 1 >= 0.5 THEN CEIL(raw_final_total)
        ELSE FLOOR(raw_final_total)
    END;
    
    -- Calculate rounding adjustment
    rounding_diff := rounded_final_total - raw_final_total;
    
    -- Update quotation with calculated totals
    UPDATE quotations SET
        subtotal = items_total,
        additional_costs_total = additional_total,
        gst_amount = gst_total,
        raw_total = raw_final_total,
        total_amount = rounded_final_total,
        rounding_adjustment = rounding_diff
    WHERE id = quotation_uuid;
END;
$function$;

-- Update quotation_items calculation logic in update_quotation_totals
CREATE OR REPLACE FUNCTION public.update_quotation_totals(quotation_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    items_total DECIMAL(12,2) := 0;
    additional_total DECIMAL(12,2) := 0;
    gst_total DECIMAL(12,2) := 0;
    raw_final_total DECIMAL(12,2) := 0;
    rounded_final_total DECIMAL(12,2) := 0;
    rounding_diff DECIMAL(12,2) := 0;
    quotation_record RECORD;
BEGIN
    -- Get quotation details
    SELECT * INTO quotation_record FROM quotations WHERE id = quotation_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate items subtotal
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN rate_type = 'per_kg' THEN
                    COALESCE(manual_net_weight, weight * pieces, 0) * price_per_piece
                ELSE pieces * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM quotation_items 
    WHERE quotation_id = quotation_uuid;
    
    -- Update individual item subtotals
    UPDATE quotation_items SET
        subtotal = CASE 
            WHEN rate_type = 'per_kg' THEN
                COALESCE(manual_net_weight, weight * pieces, 0) * price_per_piece
            ELSE pieces * price_per_piece
        END
    WHERE quotation_id = quotation_uuid;
    
    -- Calculate additional costs total
    SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0) 
    INTO additional_total
    FROM quotation_additional_costs 
    WHERE quotation_id = quotation_uuid;
    
    -- Calculate GST if enabled
    IF quotation_record.gst_enabled THEN
        gst_total := (items_total + additional_total) * (quotation_record.gst_percentage / 100);
    END IF;
    
    -- Calculate raw final total
    raw_final_total := items_total + additional_total + gst_total;
    
    -- Apply rounding logic
    rounded_final_total := CASE 
        WHEN raw_final_total % 1 >= 0.5 THEN CEIL(raw_final_total)
        ELSE FLOOR(raw_final_total)
    END;
    
    -- Calculate rounding adjustment
    rounding_diff := rounded_final_total - raw_final_total;
    
    -- Update quotation with calculated totals
    UPDATE quotations SET
        subtotal = items_total,
        additional_costs_total = additional_total,
        gst_amount = gst_total,
        raw_total = raw_final_total,
        total_amount = rounded_final_total,
        rounding_adjustment = rounding_diff
    WHERE id = quotation_uuid;
END;
$function$;


ALTER FUNCTION "public"."update_quotation_totals"("quotation_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" character varying(255) NOT NULL,
    "company_address" "text" NOT NULL,
    "company_gstin" character varying(15) NOT NULL,
    "company_phone" character varying(20),
    "company_email" character varying(255),
    "company_website" character varying(255),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dealer_logo_1" "text",
    "dealer_logo_2" "text",
    "authorized_dealers_label" character varying(255) DEFAULT 'Authorized Dealers'::character varying
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gstin_number" character varying(15),
    "address" "text",
    "mobile_number" character varying(20)
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."customers"."gstin_number" IS 'GST Identification Number of the customer';



COMMENT ON COLUMN "public"."customers"."address" IS 'Complete address of the customer';



CREATE TABLE IF NOT EXISTS "public"."keep-alive" (
    "id" bigint NOT NULL,
    "name" "text" DEFAULT ''::"text",
    "random" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."keep-alive" OWNER TO "postgres";


ALTER TABLE "public"."keep-alive" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."keep-alive_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "stock_id" "uuid" NOT NULL,
    "pieces_used" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price_per_piece" numeric(10,2) DEFAULT 0 NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "weight" numeric(10,2),
    "stock_name" character varying(255),
    "stock_code" character varying(50),
    "stock_length" character varying(10),
    "is_from_stock_table" boolean DEFAULT true NOT NULL,
    "manual_net_weight" numeric(10,3),
    CONSTRAINT "order_items_pieces_used_check" CHECK (("pieces_used" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "color_code" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_hidden" boolean DEFAULT false NOT NULL,
    "vehicle_number" character varying(50),
    "agent_name" character varying(255),
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "gst_enabled" boolean DEFAULT false NOT NULL,
    "gst_type" character varying(10),
    "gst_percentage" numeric(5,2) DEFAULT 18.00,
    "gst_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "raw_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "rounding_adjustment" numeric(12,2) DEFAULT 0 NOT NULL,
    "show_unit_price" boolean DEFAULT true NOT NULL,
    "customer_gstin" "text",
    CONSTRAINT "chk_orders_raw_total_non_negative" CHECK (("raw_total" >= (0)::numeric)),
    CONSTRAINT "orders_gst_type_check" CHECK ((("gst_type")::"text" = ANY ((ARRAY['CGST_SGST'::character varying, 'IGST'::character varying, 'UTGST'::character varying])::"text"[])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."is_hidden" IS 'When true, order is hidden from normal view and only visible to admins';



CREATE TABLE IF NOT EXISTS "public"."quotation_additional_costs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "label" character varying(255) NOT NULL,
    "type" character varying(10) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quotation_additional_costs_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "quotation_additional_costs_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['add'::character varying, 'discount'::character varying])::"text"[])))
);


ALTER TABLE "public"."quotation_additional_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "stock_name" character varying(255) NOT NULL,
    "stock_code" character varying(50) NOT NULL,
    "length" character varying(10) NOT NULL,
    "pieces" integer NOT NULL,
    "price_per_piece" numeric(10,2) NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "is_from_stock_table" boolean DEFAULT true NOT NULL,
    "stock_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "weight" numeric(10,2),
    "manual_net_weight" numeric(10,3),
    CONSTRAINT "quotation_items_length_check" CHECK ((("length")::"text" = ANY (ARRAY[('14ft'::character varying)::"text", ('16ft'::character varying)::"text", ('12ft'::character varying)::"text"]))),
    CONSTRAINT "quotation_items_pieces_check" CHECK (("pieces" > 0)),
    CONSTRAINT "quotation_items_price_per_piece_check" CHECK (("price_per_piece" > (0)::numeric))
);


ALTER TABLE "public"."quotation_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."quotation_items"."weight" IS 'Weight of the item in kg (optional, can be manual or from stock)';



CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quotation_number" integer NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "quotation_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "additional_costs_total" numeric(12,2) DEFAULT 0 NOT NULL,
    "gst_enabled" boolean DEFAULT false NOT NULL,
    "gst_type" character varying(10),
    "gst_percentage" numeric(5,2) DEFAULT 18.00,
    "gst_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "show_unit_price" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_address" "text",
    "customer_gstin" character varying(15),
    "raw_total" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "rounding_adjustment" numeric(12,2) DEFAULT 0.00 NOT NULL,
    CONSTRAINT "chk_raw_total_non_negative" CHECK (("raw_total" >= (0)::numeric)),
    CONSTRAINT "chk_rounding_adjustment_valid" CHECK ((("rounding_adjustment" >= ('-1'::integer)::numeric) AND ("rounding_adjustment" <= (1)::numeric))),
    CONSTRAINT "quotations_gst_type_check" CHECK ((("gst_type")::"text" = ANY ((ARRAY['CGST_SGST'::character varying, 'IGST'::character varying, 'UTGST'::character varying])::"text"[])))
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."quotations"."customer_address" IS 'Customer address at the time of quotation creation';



COMMENT ON COLUMN "public"."quotations"."customer_gstin" IS 'Customer GSTIN at the time of quotation creation';



COMMENT ON COLUMN "public"."quotations"."raw_total" IS 'The total amount before rounding';



COMMENT ON COLUMN "public"."quotations"."rounding_adjustment" IS 'The difference between rounded total_amount and raw_total';



CREATE SEQUENCE IF NOT EXISTS "public"."quotations_quotation_number_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quotations_quotation_number_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quotations_quotation_number_seq" OWNED BY "public"."quotations"."quotation_number";



CREATE TABLE IF NOT EXISTS "public"."stock_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "stock_id" "uuid" NOT NULL,
    "type" character varying(20) NOT NULL,
    "quantity_change" integer NOT NULL,
    "quantity_before" integer NOT NULL,
    "quantity_after" integer NOT NULL,
    "reference_id" "uuid",
    "reference_type" character varying(20),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stock_history_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['ADD'::character varying, 'SELL'::character varying, 'ADJUST'::character varying])::"text"[])))
);


ALTER TABLE "public"."stock_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "length" character varying(10) NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "weight" numeric(10,2),
    CONSTRAINT "stocks_length_check" CHECK ((("length")::"text" = ANY (ARRAY[('14ft'::character varying)::"text", ('16ft'::character varying)::"text", ('12ft'::character varying)::"text"])))
);


ALTER TABLE "public"."stocks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."stocks"."weight" IS 'Weight of stock item in kg (optional)';



ALTER TABLE ONLY "public"."quotations" ALTER COLUMN "quotation_number" SET DEFAULT "nextval"('"public"."quotations_quotation_number_seq"'::"regclass");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."keep-alive"
    ADD CONSTRAINT "keep-alive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_additional_costs"
    ADD CONSTRAINT "quotation_additional_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stocks"
    ADD CONSTRAINT "stocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stocks"
    ADD CONSTRAINT "unique_product_id" UNIQUE ("length", "code");



CREATE INDEX "idx_company_settings_active" ON "public"."company_settings" USING "btree" ("is_active");



CREATE INDEX "idx_customers_gstin" ON "public"."customers" USING "btree" ("gstin_number");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_stock_id" ON "public"."order_items" USING "btree" ("stock_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_date" ON "public"."orders" USING "btree" ("order_date");



CREATE INDEX "idx_orders_is_hidden" ON "public"."orders" USING "btree" ("is_hidden");



CREATE INDEX "idx_quotation_additional_costs_quotation_id" ON "public"."quotation_additional_costs" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotation_items_quotation_id" ON "public"."quotation_items" USING "btree" ("quotation_id");



CREATE INDEX "idx_quotation_items_stock_id" ON "public"."quotation_items" USING "btree" ("stock_id");



CREATE INDEX "idx_quotations_customer_name" ON "public"."quotations" USING "btree" ("customer_name");



CREATE INDEX "idx_quotations_date" ON "public"."quotations" USING "btree" ("quotation_date");



CREATE INDEX "idx_quotations_raw_total" ON "public"."quotations" USING "btree" ("raw_total");



CREATE INDEX "idx_stock_history_created_at" ON "public"."stock_history" USING "btree" ("created_at");



CREATE INDEX "idx_stock_history_stock_id" ON "public"."stock_history" USING "btree" ("stock_id");



CREATE INDEX "idx_stock_history_type" ON "public"."stock_history" USING "btree" ("type");



CREATE INDEX "idx_stocks_code" ON "public"."stocks" USING "btree" ("code");



CREATE OR REPLACE TRIGGER "trigger_log_stock_change" AFTER UPDATE ON "public"."stocks" FOR EACH ROW EXECUTE FUNCTION "public"."log_stock_change"();



CREATE OR REPLACE TRIGGER "update_company_settings_updated_at" BEFORE UPDATE ON "public"."company_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quotations_updated_at" BEFORE UPDATE ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stocks_updated_at" BEFORE UPDATE ON "public"."stocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_additional_costs"
    ADD CONSTRAINT "quotation_additional_costs_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_history"
    ADD CONSTRAINT "stock_history_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."log_stock_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_stock_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_stock_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_totals"("order_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_totals"("order_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_totals"("order_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_quotation_totals"("quotation_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_quotation_totals"("quotation_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_quotation_totals"("quotation_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."keep-alive" TO "anon";
GRANT ALL ON TABLE "public"."keep-alive" TO "authenticated";
GRANT ALL ON TABLE "public"."keep-alive" TO "service_role";



GRANT ALL ON SEQUENCE "public"."keep-alive_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."keep-alive_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."keep-alive_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_additional_costs" TO "anon";
GRANT ALL ON TABLE "public"."quotation_additional_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_additional_costs" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_items" TO "anon";
GRANT ALL ON TABLE "public"."quotation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quotations_quotation_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quotations_quotation_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quotations_quotation_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stock_history" TO "anon";
GRANT ALL ON TABLE "public"."stock_history" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_history" TO "service_role";



GRANT ALL ON TABLE "public"."stocks" TO "anon";
GRANT ALL ON TABLE "public"."stocks" TO "authenticated";
GRANT ALL ON TABLE "public"."stocks" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































