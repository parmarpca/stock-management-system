-- Create order_additional_costs table
CREATE TABLE IF NOT EXISTS public.order_additional_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('add', 'discount')),
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_additional_costs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all for authenticated users" ON public.order_additional_costs
    FOR ALL USING (auth.role() = 'authenticated');

-- Update update_order_totals function
CREATE OR REPLACE FUNCTION "public"."update_order_totals"("order_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    items_total DECIMAL(12,2) := 0;
    additional_total DECIMAL(12,2) := 0;
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
    
    -- Calculate items subtotal based on rate_type
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN rate_type = 'per_kg' AND weight IS NOT NULL THEN weight * pieces_used * price_per_piece
                ELSE pieces_used * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM order_items 
    WHERE order_id = order_uuid;
    
    -- Update individual item subtotals
    UPDATE order_items SET
        subtotal = CASE 
            WHEN rate_type = 'per_kg' AND weight IS NOT NULL THEN weight * pieces_used * price_per_piece
            ELSE pieces_used * price_per_piece
        END
    WHERE order_id = order_uuid;
    
    -- Calculate additional costs total
    SELECT COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0) 
    INTO additional_total
    FROM order_additional_costs 
    WHERE order_id = order_uuid;
    
    -- Calculate GST if enabled
    IF order_record.gst_enabled THEN
        gst_total := (items_total + additional_total) * (order_record.gst_percentage / 100);
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
    
    -- Update order with calculated totals
    UPDATE orders SET
        subtotal = items_total,
        gst_amount = gst_total,
        raw_total = raw_final_total,
        total_amount = rounded_final_total,
        rounding_adjustment = rounding_diff
    WHERE id = order_uuid;
END;
$$;
