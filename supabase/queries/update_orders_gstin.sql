-- Add customer_gstin to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_gstin text;
