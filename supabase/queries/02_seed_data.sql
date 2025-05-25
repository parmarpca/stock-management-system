-- Insert sample customers
INSERT INTO customers (name) VALUES 
('ABC Construction'),
('XYZ Builders'),
('Metro Infrastructure');

-- Insert sample stocks
INSERT INTO stocks (name, code, length, quantity) VALUES 
('Steel Rebar', 'SR001', '16ft', 25),
('Steel Rebar', 'SR002', '12ft', 75),
('Iron Rod', 'IR001', '16ft', 15),
('Aluminum Pipe', 'AP001', '12ft', 120);

-- Insert sample orders
INSERT INTO orders (customer_id, order_date, color_code) 
SELECT 
    c.id,
    '2024-05-24'::date,
    'Blue'
FROM customers c WHERE c.name = 'ABC Construction';

INSERT INTO orders (customer_id, order_date, color_code) 
SELECT 
    c.id,
    '2024-05-23'::date,
    'Red'
FROM customers c WHERE c.name = 'XYZ Builders';

-- Insert sample order items
INSERT INTO order_items (order_id, stock_id, pieces_used)
SELECT 
    o.id,
    s.id,
    10
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN stocks s ON s.code = 'SR001'
WHERE c.name = 'ABC Construction' AND o.order_date = '2024-05-24';

INSERT INTO order_items (order_id, stock_id, pieces_used)
SELECT 
    o.id,
    s.id,
    5
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN stocks s ON s.code = 'SR002'
WHERE c.name = 'XYZ Builders' AND o.order_date = '2024-05-23'; 