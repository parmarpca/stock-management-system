-- Create quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number SERIAL,
    customer_name VARCHAR(255) NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    additional_costs_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_enabled BOOLEAN NOT NULL DEFAULT false,
    gst_type VARCHAR(10) CHECK (gst_type IN ('CGST_SGST', 'IGST', 'UTGST')),
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    show_unit_price BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation_items table
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    stock_name VARCHAR(255) NOT NULL,
    stock_code VARCHAR(50) NOT NULL,
    length VARCHAR(10) CHECK (length IN ('16ft', '12ft')) NOT NULL,
    pieces INTEGER NOT NULL CHECK (pieces > 0),
    price_per_piece DECIMAL(10,2) NOT NULL CHECK (price_per_piece > 0),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_from_stock_table BOOLEAN NOT NULL DEFAULT true,
    stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotation_additional_costs table
CREATE TABLE quotation_additional_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('add', 'discount')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX idx_quotations_date ON quotations(quotation_date);
CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_stock_id ON quotation_items(stock_id);
CREATE INDEX idx_quotation_additional_costs_quotation_id ON quotation_additional_costs(quotation_id);

-- Create trigger for quotations updated_at only (no recursive calculations)
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Simple function to calculate and update quotation totals (called manually from application)
CREATE OR REPLACE FUNCTION update_quotation_totals(quotation_uuid UUID)
RETURNS VOID AS $$
DECLARE
    items_total DECIMAL(12,2) := 0;
    additional_total DECIMAL(12,2) := 0;
    gst_total DECIMAL(12,2) := 0;
    final_total DECIMAL(12,2) := 0;
    quotation_record RECORD;
BEGIN
    -- Get quotation details
    SELECT * INTO quotation_record FROM quotations WHERE id = quotation_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate items subtotal
    SELECT COALESCE(SUM(pieces * price_per_piece), 0) INTO items_total
    FROM quotation_items WHERE quotation_id = quotation_uuid;
    
    -- Update individual item subtotals
    UPDATE quotation_items SET
        subtotal = pieces * price_per_piece
    WHERE quotation_id = quotation_uuid;
    
    -- Calculate additional costs total
    SELECT COALESCE(
        SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END), 0
    ) INTO additional_total
    FROM quotation_additional_costs WHERE quotation_id = quotation_uuid;
    
    -- Calculate GST if enabled
    IF quotation_record.gst_enabled THEN
        gst_total := (items_total + additional_total) * (quotation_record.gst_percentage / 100);
    END IF;
    
    -- Calculate final total
    final_total := items_total + additional_total + gst_total;
    
    -- Update quotation with calculated totals
    UPDATE quotations SET
        subtotal = items_total,
        additional_costs_total = additional_total,
        gst_amount = gst_total,
        total_amount = final_total
    WHERE id = quotation_uuid;
END;
$$ LANGUAGE plpgsql; 