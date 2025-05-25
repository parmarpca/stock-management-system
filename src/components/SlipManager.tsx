
import { useState } from 'react';
import { ShoppingCart, Plus, Printer, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
  created_at: string;
}

interface Slip {
  id: string;
  customer_id: string;
  stock_id: string;
  length: '16ft' | '12ft';
  pieces_used: number;
  date: string;
  color_code?: string;
  customer_name?: string;
  stock_name?: string;
}

interface SlipManagerProps {
  stocks: Stock[];
  customers: Customer[];
  slips: Slip[];
  onSlipCreate: (slip: Omit<Slip, 'id'>) => void;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const SlipManager = ({ stocks, customers, slips, onSlipCreate, setCustomers }: SlipManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<Slip | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [pieces, setPieces] = useState(0);
  const [length, setLength] = useState<'16ft' | '12ft'>('16ft');

  // Filter states
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    stock.code.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const enhancedSlips = slips.map(slip => ({
    ...slip,
    customer_name: customers.find(c => c.id === slip.customer_id)?.name || 'Unknown',
    stock_name: stocks.find(s => s.id === slip.stock_id)?.name || 'Unknown'
  }));

  const filteredSlips = enhancedSlips.filter(slip => {
    const matchesCustomer = !filterCustomer || slip.customer_id === filterCustomer;
    const matchesDateFrom = !filterDateFrom || slip.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || slip.date <= filterDateTo;
    return matchesCustomer && matchesDateFrom && matchesDateTo;
  });

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setStockSearch(`${stock.name} (${stock.code})`);
    setLength(stock.length);
  };

  const resetForm = () => {
    setCustomerName('');
    setColorCode('');
    setStockSearch('');
    setSelectedStock(null);
    setPieces(0);
    setLength('16ft');
  };

  const handleCreateOrder = () => {
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
        created_at: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [...prev, customer!]);
    }

    const orderData = {
      customer_id: customer.id,
      stock_id: selectedStock.id,
      length: selectedStock.length,
      pieces_used: pieces,
      date: new Date().toISOString().split('T')[0],
      color_code: colorCode,
      customer_name: customer.name,
      stock_name: selectedStock.name
    };

    onSlipCreate(orderData);
    resetForm();
    setIsCreateDialogOpen(false);
    alert('Order placed successfully!');
  };

  const handlePrintSlip = (slip: Slip) => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Order Slip</h2>
        <hr>
        <p><strong>Order ID:</strong> ${slip.id}</p>
        <p><strong>Date:</strong> ${slip.date}</p>
        <p><strong>Customer:</strong> ${slip.customer_name}</p>
        <p><strong>Stock Item:</strong> ${slip.stock_name}</p>
        <p><strong>Length:</strong> ${slip.length}</p>
        <p><strong>Pieces Used:</strong> ${slip.pieces_used}</p>
        <p><strong>Color Code:</strong> ${slip.color_code || 'N/A'}</p>
        <hr>
        <p><em>Factory Stock Management System</em></p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Order Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create New Order</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    list="customer-suggestions"
                    className="w-full"
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
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="length">Length</Label>
                <Select value={length} onValueChange={(value: '16ft' | '12ft') => setLength(value)}>
                  <SelectTrigger className="w-full">
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
                  className="w-full"
                />
                {selectedStock && pieces > selectedStock.quantity && (
                  <p className="text-sm text-red-600 mt-1">
                    Only {selectedStock.quantity} pieces available
                  </p>
                )}
              </div>

              <Button 
                onClick={handleCreateOrder} 
                className="w-full"
                disabled={!customerName || !colorCode || !selectedStock || pieces <= 0 || (selectedStock && pieces > selectedStock.quantity)}
              >
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-customer">Customer</Label>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-3 lg:space-y-4">
        {filteredSlips.map((slip) => (
          <Card key={slip.id}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                  <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base lg:text-lg">Order #{slip.id}</h3>
                    <p className="text-sm lg:text-base text-gray-700">{slip.customer_name}</p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {slip.stock_name} - {slip.length} - {slip.pieces_used} pieces
                    </p>
                    {slip.color_code && (
                      <p className="text-xs lg:text-sm text-gray-600">Color: {slip.color_code}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="text-left lg:text-right">
                    <Badge variant="outline" className="text-xs">{slip.date}</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintSlip(slip)}
                      className="flex items-center space-x-1"
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SlipManager;
