
import { useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Stock {
  id: string;
  name: string;
  code: string;
  length: '16ft' | '12ft';
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  color_code: string;
  created_at: string;
}

interface OrderFormProps {
  stocks: Stock[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onOrderCreate: (orderData: any) => void;
}

const OrderForm = ({ stocks, customers, setCustomers, onOrderCreate }: OrderFormProps) => {
  const [customerName, setCustomerName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [length, setLength] = useState<'16ft' | '12ft'>('16ft');
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [pieces, setPieces] = useState(0);

  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    stock.code.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setStockSearch(`${stock.name} (${stock.code})`);
    setLength(stock.length);
  };

  const handleSubmit = () => {
    if (!customerName || !colorCode || !selectedStock || pieces <= 0) {
      alert('Please fill all fields');
      return;
    }

    if (pieces > selectedStock.quantity) {
      alert(`Only ${selectedStock.quantity} pieces available for ${selectedStock.name}`);
      return;
    }

    // Find or create customer
    let customer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    
    if (!customer) {
      customer = {
        id: Date.now().toString(),
        name: customerName,
        color_code: colorCode,
        created_at: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [...prev, customer!]);
    }

    // Create order (slip)
    const orderData = {
      customer_id: customer.id,
      stock_id: selectedStock.id,
      length: selectedStock.length,
      pieces_used: pieces,
      date: new Date().toISOString().split('T')[0],
      customer_name: customer.name,
      stock_name: selectedStock.name
    };

    onOrderCreate(orderData);

    // Reset form
    setCustomerName('');
    setColorCode('');
    setStockSearch('');
    setSelectedStock(null);
    setPieces(0);
    setLength('16ft');

    alert('Order placed successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6" />
            <span>Place New Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                list="customer-suggestions"
              />
              <datalist id="customer-suggestions">
                {customers.map(customer => (
                  <option key={customer.id} value={customer.name} />
                ))}
              </datalist>
            </div>

            <div>
              <Label htmlFor="color-code">Color Code</Label>
              <Input
                id="color-code"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                placeholder="e.g., Blue, Red, Green"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="length">Length</Label>
            <Select value={length} onValueChange={(value: '16ft' | '12ft') => setLength(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16ft">16ft</SelectItem>
                <SelectItem value="12ft">12ft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stock-search">Stock Item</Label>
            <Input
              id="stock-search"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Search stock by name or code..."
            />
            
            {stockSearch && filteredStocks.length > 0 && !selectedStock && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredStocks.slice(0, 5).map(stock => (
                  <button
                    key={stock.id}
                    className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-b-0"
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="font-medium">{stock.name} ({stock.code})</div>
                    <div className="text-sm text-gray-600">
                      {stock.length} - Available: {stock.quantity} pieces
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedStock && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="font-medium">{selectedStock.name} ({selectedStock.code})</div>
                <div className="text-sm text-gray-600">
                  Available: {selectedStock.quantity} pieces
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="pieces">Number of Pieces</Label>
            <Input
              id="pieces"
              type="number"
              min="1"
              max={selectedStock?.quantity || 999}
              value={pieces}
              onChange={(e) => setPieces(parseInt(e.target.value) || 0)}
              placeholder="Enter number of pieces"
            />
            {selectedStock && pieces > selectedStock.quantity && (
              <p className="text-sm text-red-600 mt-1">
                Only {selectedStock.quantity} pieces available
              </p>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!customerName || !colorCode || !selectedStock || pieces <= 0 || (selectedStock && pieces > selectedStock.quantity)}
          >
            Place Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderForm;
