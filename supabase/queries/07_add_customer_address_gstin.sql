-- Add GSTIN Number and Address to customers table
ALTER TABLE customers 
ADD COLUMN gstin_number VARCHAR(15),
ADD COLUMN address TEXT;

-- Add index for GSTIN for better search performance
CREATE INDEX idx_customers_gstin ON customers(gstin_number);

-- Add comment to explain the new columns
COMMENT ON COLUMN customers.gstin_number IS 'GST Identification Number of the customer';
COMMENT ON COLUMN customers.address IS 'Complete address of the customer'; 