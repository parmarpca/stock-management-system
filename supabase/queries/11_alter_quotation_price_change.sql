-- Step 1: First add the new columns
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS raw_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rounding_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- Step 2: Add check constraints
ALTER TABLE quotations
ADD CONSTRAINT chk_raw_total_non_negative CHECK (raw_total >= 0),
ADD CONSTRAINT chk_rounding_adjustment_valid CHECK (rounding_adjustment >= -1 AND rounding_adjustment <= 1);

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_quotations_raw_total ON quotations(raw_total);

-- Step 4: Add helpful comments
COMMENT ON COLUMN quotations.raw_total IS 'The total amount before rounding';
COMMENT ON COLUMN quotations.rounding_adjustment IS 'The difference between rounded total_amount and raw_total';

-- Step 5: Then create/update the function
CREATE OR REPLACE FUNCTION update_quotation_totals(quotation_uuid UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- Step 6: Finally, update existing quotations
DO $$ 
DECLARE 
    q_record RECORD;
BEGIN
    FOR q_record IN SELECT id FROM quotations
    LOOP
        PERFORM update_quotation_totals(q_record.id);
    END LOOP;
END $$;