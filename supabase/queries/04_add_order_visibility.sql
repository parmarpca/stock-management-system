-- Add is_hidden column to orders table for hiding/showing orders
-- Default value is false (SHOW) - orders are visible by default

ALTER TABLE orders 
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance when filtering by visibility
CREATE INDEX idx_orders_is_hidden ON orders(is_hidden);

-- Add comment to explain the column
COMMENT ON COLUMN orders.is_hidden IS 'When true, order is hidden from normal view and only visible to admins'; 