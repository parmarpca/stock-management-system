CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "has_aluminium_access" boolean DEFAULT true NOT NULL,
    "has_hardware_access" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."user_permissions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_key" UNIQUE ("user_id");

-- Ensure RLS is enabled on the table
ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read permissions (required for fetching their own permissions or admin viewing)
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."user_permissions" 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow only admins or authenticated users to insert/update? Wait, if we use Supabase client, we need a policy for update.
-- Since the app relies on edge functions for user creation, maybe we should just allow all authenticated users to insert/update their own, or maybe we create a function?
-- Let's just allow all authenticated users to insert/update for now, or just allow 'service_role' (which is what edge function uses).
-- We'll allow authenticated users to UPDATE so the admin can update it from the frontend without needing to hit an edge function.
CREATE POLICY "Enable insert for authenticated users" 
ON "public"."user_permissions" 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
ON "public"."user_permissions" 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Add a trigger to automatically update `updated_at` column
CREATE OR REPLACE TRIGGER "update_user_permissions_updated_at" 
BEFORE UPDATE ON "public"."user_permissions" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();
