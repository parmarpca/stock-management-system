-- Add rate_type to quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS rate_type TEXT NOT NULL DEFAULT 'per_kg' CHECK (rate_type IN ('per_kg', 'per_pc'));

-- Update update_quotation_totals function to use rate_type
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
    
    -- Calculate items subtotal based on rate_type
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN rate_type = 'per_kg' AND weight IS NOT NULL THEN weight * pieces * price_per_piece
                ELSE pieces * price_per_piece
            END
        ), 0
    ) INTO items_total
    FROM quotation_items 
    WHERE quotation_id = quotation_uuid;
    
    -- Update individual item subtotals
    UPDATE quotation_items SET
        subtotal = CASE 
            WHEN rate_type = 'per_kg' AND weight IS NOT NULL THEN weight * pieces * price_per_piece
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
$$;
