-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create company_settings table
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT NOT NULL,
    company_gstin VARCHAR(15) NOT NULL,
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    gstin_number VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stocks table
CREATE TABLE stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    length VARCHAR(10) CHECK (length IN ('16ft', '12ft')) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    weight DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_history table
CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    action_type VARCHAR(10) CHECK (action_type IN ('add', 'remove')) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20) CHECK (reference_type IN ('manual', 'order')) NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    color_code VARCHAR(50),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    pieces_used INTEGER NOT NULL CHECK (pieces_used > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number SERIAL,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    customer_gstin VARCHAR(15),
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    additional_costs_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_enabled BOOLEAN NOT NULL DEFAULT false,
    gst_type VARCHAR(10) CHECK (gst_type IN ('CGST_SGST', 'IGST', 'UTGST')),
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    raw_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    rounding_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0,
    show_unit_price BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_raw_total_non_negative CHECK (raw_total >= 0),
    CONSTRAINT chk_rounding_adjustment_valid CHECK (rounding_adjustment >= -1 AND rounding_adjustment <= 1)
);

-- Create quotation_items table
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    stock_name VARCHAR(255) NOT NULL,
    stock_code VARCHAR(50) NOT NULL,
    length VARCHAR(10) CHECK (length IN ('16ft', '12ft')) NOT NULL,
    pieces INTEGER NOT NULL CHECK (pieces > 0),
    weight DECIMAL(10,2),
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

-- Create all necessary indexes
CREATE INDEX idx_company_settings_active ON company_settings(is_active);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_stocks_code ON stocks(code);
CREATE INDEX idx_stock_history_stock_id ON stock_history(stock_id);
CREATE INDEX idx_stock_history_reference ON stock_history(reference_type, reference_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_stock_id ON order_items(stock_id);
CREATE INDEX idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX idx_quotations_date ON quotations(quotation_date);
CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_stock_id ON quotation_items(stock_id);
CREATE INDEX idx_quotation_additional_costs_quotation_id ON quotation_additional_costs(quotation_id);
CREATE INDEX idx_quotations_raw_total ON quotations(raw_total);

-- Create all necessary triggers
CREATE TRIGGER update_company_settings_updated_at 
    BEFORE UPDATE ON company_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at 
    BEFORE UPDATE ON stocks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at 
    BEFORE UPDATE ON quotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate quotation totals with weight-based pricing
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
    
    -- Update individual item subtotals
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

-- Add helpful comments
COMMENT ON TABLE quotations IS 'Stores quotation information with support for weight-based pricing and rounding';
COMMENT ON COLUMN quotations.raw_total IS 'The total amount before rounding';
COMMENT ON COLUMN quotations.rounding_adjustment IS 'The difference between rounded total_amount and raw_total';
COMMENT ON COLUMN quotation_items.weight IS 'Weight per piece in kg';