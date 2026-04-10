-- SQL Migration to update Customers and Orders schema
-- Run this in your Supabase SQL Editor

-- 1. Update Customers Table
ALTER TABLE customers ADD COLUMN mobile_number VARCHAR(20);

-- 2. Update Orders Table (to match Quotations)
ALTER TABLE orders ADD COLUMN vehicle_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN agent_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN gst_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN gst_type VARCHAR(10) CHECK (gst_type IN ('CGST_SGST', 'IGST', 'UTGST'));
ALTER TABLE orders ADD COLUMN gst_percentage DECIMAL(5,2) DEFAULT 18.00;
ALTER TABLE orders ADD COLUMN gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN raw_total DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN rounding_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN show_unit_price BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE orders ADD COLUMN customer_address TEXT;

-- 2.5 Create Order Additional Costs Table
CREATE TABLE IF NOT EXISTS public.order_additional_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('add', 'discount')),
    amount DECIMAL(10,2) NOT NULL
);

-- 3. Update Order Items Table
ALTER TABLE order_items ADD COLUMN price_per_piece DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN weight DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN stock_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN stock_code VARCHAR(50);
ALTER TABLE order_items ADD COLUMN stock_length VARCHAR(10);
ALTER TABLE order_items ADD COLUMN is_from_stock_table BOOLEAN NOT NULL DEFAULT true;

-- Note: In the existing master query we don't have constraints checked for raw_total in orders, 
-- but adding it for safety.
ALTER TABLE orders ADD CONSTRAINT chk_orders_raw_total_non_negative CHECK (raw_total >= 0);

-- 4. Create function to calculate order totals with weight-based pricing
CREATE OR REPLACE FUNCTION update_order_totals(order_uuid UUID)
RETURNS VOID AS $$
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
    
    -- Check for additional costs and update raw_final_total
    SELECT COALESCE(
        SUM(
            CASE WHEN type = 'add' THEN amount
                 WHEN type = 'discount' THEN -amount
                 ELSE 0
            END
        ), 0
    ) INTO raw_final_total
    FROM order_additional_costs
    WHERE order_id = order_uuid;

    -- Add items total and GST to raw final total (which currently only contains additional costs)
    raw_final_total := raw_final_total + items_total + gst_total;
    
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
$$ LANGUAGE plpgsql;
