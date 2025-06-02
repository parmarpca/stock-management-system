-- Add weight field to quotation_items table
ALTER TABLE quotation_items 
ADD COLUMN weight DECIMAL(10,2);

-- Add customer address and GSTIN to quotations table
ALTER TABLE quotations 
ADD COLUMN customer_address TEXT,
ADD COLUMN customer_gstin VARCHAR(15);

-- Add comment to explain the new columns
COMMENT ON COLUMN quotation_items.weight IS 'Weight of the item in kg (optional, can be manual or from stock)';
COMMENT ON COLUMN quotations.customer_address IS 'Customer address at the time of quotation creation';
COMMENT ON COLUMN quotations.customer_gstin IS 'Customer GSTIN at the time of quotation creation'; 