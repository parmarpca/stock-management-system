
import { useState } from 'react';
import { FileText, Plus, Printer } from 'lucide-react';
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
  color_code: string;
  created_at: string;
}

interface Slip {
  id: string;
  customer_id: string;
  stock_id: string;
  length: '16ft' | '12ft';
  pieces_used: number;
  date: string;
  customer_name?: string;
  stock_name?: string;
}

interface SlipManagerProps {
  stocks: Stock[];
  customers: Customer[];
  slips: Slip[];
  onSlipCreate: (slip: Omit<Slip, 'id'>) => void;
}

const SlipManager = ({ stocks, customers, slips, onSlipCreate }: SlipManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [piecesUsed, setPiecesUsed] = useState(0);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Enhanced slip data with customer and stock names
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

  const handleCreateSlip = () => {
    const selectedStockItem = stocks.find(s => s.id === selectedStock);
    const selectedCustomerItem = customers.find(c => c.id === selectedCustomer);
    
    if (!selectedStockItem || !selectedCustomerItem || piecesUsed <= 0) {
      alert('Please fill all fields with valid data');
      return;
    }

    if (piecesUsed > selectedStockItem.quantity) {
      alert('Cannot use more pieces than available in stock');
      return;
    }

    const newSlip: Omit<Slip, 'id'> = {
      customer_id: selectedCustomer,
      stock_id: selectedStock,
      length: selectedStockItem.length,
      pieces_used: piecesUsed,
      date: new Date().toISOString().split('T')[0],
      customer_name: selectedCustomerItem.name,
      stock_name: selectedStockItem.name
    };

    onSlipCreate(newSlip);
    setSelectedCustomer('');
    setSelectedStock('');
    setPiecesUsed(0);
    setIsCreateDialogOpen(false);
  };

  const handlePrintSlip = (slip: Slip) => {
    const printContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Delivery Slip</h2>
        <hr>
        <p><strong>Slip ID:</strong> ${slip.id}</p>
        <p><strong>Date:</strong> ${slip.date}</p>
        <p><strong>Customer:</strong> ${slip.customer_name}</p>
        <p><strong>Stock Item:</strong> ${slip.stock_name}</p>
        <p><strong>Length:</strong> ${slip.length}</p>
        <p><strong>Pieces Used:</strong> ${slip.pieces_used}</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Slip Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Slip</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Slip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="stock">Stock Item</Label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock item" />
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map(stock => (
                      <SelectItem key={stock.id} value={stock.id}>
                        {stock.name} ({stock.code}) - {stock.length} - Available: {stock.quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pieces">Pieces Used</Label>
                <Input
                  id="pieces"
                  type="number"
                  min="1"
                  value={piecesUsed}
                  onChange={(e) => setPiecesUsed(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <Button onClick={handleCreateSlip} className="w-full">Create Slip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-customer">Customer</Label>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger>
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
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slips List */}
      <div className="grid gap-4">
        {filteredSlips.map((slip) => (
          <Card key={slip.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Slip #{slip.id}</h3>
                    <p className="text-gray-600">{slip.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {slip.stock_name} - {slip.length} - {slip.pieces_used} pieces
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge variant="outline">{slip.date}</Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePrintSlip(slip)}
                    className="flex items-center space-x-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </Button>
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
