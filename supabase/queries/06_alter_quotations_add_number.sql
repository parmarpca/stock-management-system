-- Add quotation_number field to existing quotations table
ALTER TABLE quotations ADD COLUMN quotation_number SERIAL;

-- Update existing records to have sequential numbers based on creation date
WITH numbered_quotations AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_number
  FROM quotations
)
UPDATE quotations 
SET quotation_number = numbered_quotations.new_number
FROM numbered_quotations 
WHERE quotations.id = numbered_quotations.id; 