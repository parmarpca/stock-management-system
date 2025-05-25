
import { useState } from 'react';
import { Package, Plus, Edit, AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface StockOverviewProps {
  stocks: Stock[];
  setStocks: React.Dispatch<React.SetStateAction<Stock[]>>;
  showLowStockOnly?: boolean;
}

const StockOverview = ({ stocks, setStocks, showLowStockOnly = false }: StockOverviewProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(showLowStockOnly);
  const [quickCode, setQuickCode] = useState('');

  const [newStock, setNewStock] = useState({
    name: '',
    code: '',
    length: '16ft' as '16ft' | '12ft',
    quantity: 0
  });

  // Auto-fill when code is entered
  const existingStock = stocks.find(s => s.code.toLowerCase() === quickCode.toLowerCase());

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !filterLowStock || stock.quantity < 50;
    return matchesSearch && matchesLowStock;
  });

  const handleQuickCodeChange = (code: string) => {
    setQuickCode(code);
    const found = stocks.find(s => s.code.toLowerCase() === code.toLowerCase());
    if (found) {
      setNewStock({
        name: found.name,
        code: found.code,
        length: found.length,
        quantity: 0
      });
    } else {
      setNewStock(prev => ({ ...prev, code: code }));
    }
  };

  const getCodeSuggestions = () => {
    if (!newStock.code) return [];
    return stocks.filter(s => 
      s.code.toLowerCase().includes(newStock.code.toLowerCase()) ||
      s.name.toLowerCase().includes(newStock.code.toLowerCase())
    ).slice(0, 5);
  };

  const handleAddStock = () => {
    // Check if stock with this code already exists
    const existingStockIndex = stocks.findIndex(s => s.code === newStock.code);
    
    if (existingStockIndex !== -1) {
      // Update existing stock quantity
      setStocks(prev => prev.map((stock, index) => 
        index === existingStockIndex 
          ? { ...stock, quantity: stock.quantity + newStock.quantity, updated_at: new Date().toISOString().split('T')[0] }
          : stock
      ));
    } else {
      // Add new stock
      const stock: Stock = {
        ...newStock,
        id: Date.now().toString(),
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      };
      setStocks(prev => [...prev, stock]);
    }
    
    setNewStock({ name: '', code: '', length: '16ft', quantity: 0 });
    setQuickCode('');
    setIsAddDialogOpen(false);
  };

  const handleEditStock = (stock: Stock) => {
    setStocks(prev => prev.map(s => s.id === stock.id ? { ...stock, updated_at: new Date().toISOString().split('T')[0] } : s));
    setEditingStock(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Stock Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Stock</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quick-code">Quick Code Entry</Label>
                <Input
                  id="quick-code"
                  value={quickCode}
                  onChange={(e) => handleQuickCodeChange(e.target.value)}
                  placeholder="Enter stock code..."
                />
                {existingStock && (
                  <p className="text-sm text-green-600 mt-1">
                    Found: {existingStock.name} - Current quantity: {existingStock.quantity}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newStock.name}
                  onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Steel Rebar"
                />
              </div>
              
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={newStock.code}
                  onChange={(e) => setNewStock(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="SR001"
                />
                {getCodeSuggestions().length > 0 && (
                  <div className="mt-2 border rounded-md p-2 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                    {getCodeSuggestions().map(suggestion => (
                      <button
                        key={suggestion.id}
                        className="block w-full text-left text-sm p-1 hover:bg-gray-200 rounded"
                        onClick={() => {
                          setNewStock({
                            name: suggestion.name,
                            code: suggestion.code,
                            length: suggestion.length,
                            quantity: 0
                          });
                        }}
                      >
                        {suggestion.code} - {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="length">Length</Label>
                <Select value={newStock.length} onValueChange={(value: '16ft' | '12ft') => setNewStock(prev => ({ ...prev, length: value }))}>
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newStock.quantity}
                  onChange={(e) => setNewStock(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <Button onClick={handleAddStock} className="w-full">
                {existingStock ? 'Update Quantity' : 'Add Stock'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        
        <Button
          variant={filterLowStock ? "default" : "outline"}
          onClick={() => setFilterLowStock(!filterLowStock)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Low Stock Only</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredStocks.map((stock) => (
          <Card key={stock.id} className={stock.quantity < 50 ? 'border-red-500 bg-red-50' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">{stock.name}</h3>
                    <p className="text-gray-600">Code: {stock.code} | Length: {stock.length}</p>
                    <p className="text-sm text-gray-500">Updated: {stock.updated_at}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{stock.quantity}</span>
                      {stock.quantity < 50 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-500">pieces</p>
                  </div>
                  
                  {stock.quantity < 50 && (
                    <Badge variant="destructive">Low Stock</Badge>
                  )}
                  
                  <Dialog open={editingStock?.id === stock.id} onOpenChange={(open) => !open && setEditingStock(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEditingStock(stock)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Stock Item</DialogTitle>
                      </DialogHeader>
                      {editingStock && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-quantity">Quantity</Label>
                            <Input
                              id="edit-quantity"
                              type="number"
                              value={editingStock.quantity}
                              onChange={(e) => setEditingStock(prev => prev ? ({ ...prev, quantity: parseInt(e.target.value) || 0 }) : null)}
                            />
                          </div>
                          <Button onClick={() => handleEditStock(editingStock)} className="w-full">
                            Update Stock
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StockOverview;
