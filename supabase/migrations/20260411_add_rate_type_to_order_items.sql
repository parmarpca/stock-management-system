-- Migration: Add rate_type column to order_items
-- This supports two billing modes per item:
--   per_kg  → amount = price_per_piece × (weight × pieces_used)
--   per_pc  → amount = price_per_piece × pieces_used

ALTER TABLE "public"."order_items"
  ADD COLUMN IF NOT EXISTS "rate_type" text NOT NULL DEFAULT 'per_kg'
  CHECK ("rate_type" IN ('per_kg', 'per_pc'));

-- Update the update_order_totals function to be rate_type-aware
-- (Re-create only if it exists, otherwise the existing logic still works
--  because price_per_piece stores the raw rate and the UI computes totals
--  locally for immediate display — the DB function is used for async refresh.)
CREATE OR REPLACE FUNCTION public.update_order_totals(order_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_item RECORD;
BEGIN
  -- Compute subtotal respecting rate_type
  FOR v_item IN
    SELECT price_per_piece, pieces_used, weight,
           COALESCE(rate_type, 'per_kg') AS rate_type
    FROM order_items
    WHERE order_id = order_uuid
  LOOP
    IF v_item.rate_type = 'per_kg' THEN
      v_subtotal := v_subtotal + (v_item.price_per_piece * COALESCE(v_item.weight, 0) * v_item.pieces_used);
    ELSE
      v_subtotal := v_subtotal + (v_item.price_per_piece * v_item.pieces_used);
    END IF;
  END LOOP;

  -- Apply additional costs
  DECLARE
    v_additional NUMERIC := 0;
    v_gst_enabled BOOLEAN;
    v_gst_pct NUMERIC;
    v_raw_total NUMERIC;
    v_gst_amount NUMERIC;
    v_total NUMERIC;
    v_rounding NUMERIC;
  BEGIN
    SELECT
      COALESCE(SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0)
    INTO v_additional
    FROM order_additional_costs
    WHERE order_id = order_uuid;

    SELECT gst_enabled, COALESCE(gst_percentage, 0)
    INTO v_gst_enabled, v_gst_pct
    FROM orders WHERE id = order_uuid;

    v_raw_total := v_subtotal + v_additional;
    v_gst_amount := CASE WHEN v_gst_enabled THEN v_raw_total * (v_gst_pct / 100.0) ELSE 0 END;
    v_total := ROUND(v_raw_total + v_gst_amount);
    v_rounding := v_total - (v_raw_total + v_gst_amount);

    UPDATE orders SET
      subtotal            = v_subtotal,
      raw_total           = v_raw_total,
      gst_amount          = v_gst_amount,
      total_amount        = v_total,
      rounding_adjustment = v_rounding
    WHERE id = order_uuid;
  END;
END;
$$;
