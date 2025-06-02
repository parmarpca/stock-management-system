-- Add weight field to stocks table
ALTER TABLE stocks 
ADD COLUMN weight DECIMAL(10,2);

-- Add comment to explain the weight column
COMMENT ON COLUMN stocks.weight IS 'Weight of stock item in kg (optional)'; 