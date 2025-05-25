-- Create stock_history table for tracking stock movements
CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('ADD', 'SELL', 'ADJUST')) NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    reference_id UUID, -- Can reference order_id for sales
    reference_type VARCHAR(20), -- 'ORDER', 'MANUAL', etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stock_history_stock_id ON stock_history(stock_id);
CREATE INDEX idx_stock_history_type ON stock_history(type);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);

-- Create a function to automatically log stock changes
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if quantity actually changed
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO stock_history (
            stock_id,
            type,
            quantity_change,
            quantity_before,
            quantity_after,
            notes
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.quantity > OLD.quantity THEN 'ADD'
                WHEN NEW.quantity < OLD.quantity THEN 'SELL'
                ELSE 'ADJUST'
            END,
            NEW.quantity - OLD.quantity,
            OLD.quantity,
            NEW.quantity,
            'Automatic stock update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock history logging
CREATE TRIGGER trigger_log_stock_change
    AFTER UPDATE ON stocks
    FOR EACH ROW
    EXECUTE FUNCTION log_stock_change(); 