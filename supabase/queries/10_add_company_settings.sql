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

-- Create indexes
CREATE INDEX idx_company_settings_active ON company_settings(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default company data
INSERT INTO company_settings (
    company_name, 
    company_address, 
    company_gstin,
    company_phone,
    company_email,
    is_active
) VALUES (
    'Parmar Powder Coating & Anodizer''s',
    'Raipur, Chhattisgarh',
    '22AAAAA0000A1Z5',
    '+91 9876543210',
    'info@parmarcoating.com',
    true
); 