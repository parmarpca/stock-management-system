-- Migration: Add Authorized Dealer logos and Manual Net Weight support

-- 1. Update company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS dealer_logo_1 text,
ADD COLUMN IF NOT EXISTS dealer_logo_2 text,
ADD COLUMN IF NOT EXISTS authorized_dealers_label text DEFAULT 'Authorized Dealers';

-- 2. Update order_items and quotation_items tables
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS manual_net_weight numeric(10,3);

ALTER TABLE quotation_items 
ADD COLUMN IF NOT EXISTS manual_net_weight numeric(10,3);

-- 3. Update update_order_totals function to respect manual_net_weight
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

-- 4. Update update_quotation_totals function to respect manual_net_weight
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
