ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
