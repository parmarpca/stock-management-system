import { useState } from 'react';
import { Package, Plus, Edit, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

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
  setStocks?: React.Dispatch<React.SetStateAction<Stock[]>>;
  showLowStockOnly: boolean;
  onFilterChange?: (showLowOnly: boolean) => void;
}

const StockOverview = ({ stocks, setStocks, showLowStockOnly, onFilterChange }: StockOverviewProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  const [newStock, setNewStock] = useState({
    name: '',
    code: '',
    length: '16ft' as '16ft' | '12ft',
    quantity: 0
  });

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStockOnly || stock.quantity < 50;
    return matchesSearch && matchesLowStock;
  });

  const handleAddStock = () => {
    if (!newStock.name.trim() || !newStock.code.trim() || newStock.quantity <= 0) {
      alert('Please fill all fields');
      return;
    }

    const stock: Stock = {
      ...newStock,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setStocks(prev => [...prev, stock]);
    setNewStock({ name: '', code: '', length: '16ft', quantity: 0 });
    setIsAddDialogOpen(false);
  };

  const handleEditStock = () => {
    if (!editingStock || !editingStock.name.trim() || !editingStock.code.trim() || editingStock.quantity <= 0) {
      alert('Please fill all fields');
      return;
    }

    setStocks(prev => 
      prev.map(stock => 
        stock.id === editingStock.id 
          ? { ...editingStock, updated_at: new Date().toISOString() }
          : stock
      )
    );
    setEditingStock(null);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (stock: Stock) => {
    setEditingStock({ ...stock });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Stock Overview</h2>
        
        {/* Filter Toggle */}
        {onFilterChange && (
          <div className="flex items-center space-x-2">
            <Switch
              id="low-stock-filter"
              checked={showLowStockOnly}
              onCheckedChange={onFilterChange}
            />
            <Label htmlFor="low-stock-filter" className="text-sm">Show Low Stock Only</Label>
          </div>
        )}

        {setStocks && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Stock</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stock-name">Stock Name</Label>
                  <Input
                    id="stock-name"
                    value={newStock.name}
                    onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Steel Rebar"
                  />
                </div>
                <div>
                  <Label htmlFor="stock-code">Stock Code</Label>
                  <Input
                    id="stock-code"
                    value={newStock.code}
                    onChange={(e) => setNewStock(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="SR001"
                  />
                </div>
                <div>
                  <Label htmlFor="stock-length">Stock Length</Label>
                  <select
                    id="stock-length"
                    className="w-full border rounded-md py-2 px-3"
                    value={newStock.length}
                    onChange={(e) => setNewStock(prev => ({ ...prev, length: e.target.value as '16ft' | '12ft' }))}
                  >
                    <option value="16ft">16ft</option>
                    <option value="12ft">12ft</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="stock-quantity">Stock Quantity</Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="100"
                  />
                </div>
                <Button onClick={handleAddStock} className="w-full">Add Stock</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Quick Code Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        {setStocks && (
          <Input
            placeholder="Quick code entry..."
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value)}
            className="w-full"
          />
        )}
      </div>

      {/* Stock Grid */}
      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStocks.map((stock) => (
          <Card key={stock.id} className={stock.quantity < 50 ? 'border-red-200 bg-red-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {stock.quantity < 50 && (
                    <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                  )}
                </div>
                {setStocks && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditDialog(stock)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-sm lg:text-base truncate">{stock.name}</h3>
                <p className="text-xs text-gray-600">Code: {stock.code}</p>
                <p className="text-xs text-gray-600">Length: {stock.length}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Quantity:</span>
                  <span className={`font-bold text-lg ${stock.quantity < 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {stock.quantity}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-stock-name">Stock Name</Label>
              <Input
                id="edit-stock-name"
                value={editingStock?.name || ''}
                onChange={(e) => setEditingStock(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Steel Rebar"
              />
            </div>
            <div>
              <Label htmlFor="edit-stock-code">Stock Code</Label>
              <Input
                id="edit-stock-code"
                value={editingStock?.code || ''}
                onChange={(e) => setEditingStock(prev => prev ? { ...prev, code: e.target.value } : null)}
                placeholder="SR001"
              />
            </div>
            <div>
              <Label htmlFor="edit-stock-length">Stock Length</Label>
              <select
                id="edit-stock-length"
                className="w-full border rounded-md py-2 px-3"
                value={editingStock?.length || '16ft'}
                onChange={(e) => setEditingStock(prev => prev ? { ...prev, length: e.target.value as '16ft' | '12ft' } : null)}
              >
                <option value="16ft">16ft</option>
                <option value="12ft">12ft</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-stock-quantity">Stock Quantity</Label>
              <Input
                id="edit-stock-quantity"
                type="number"
                value={editingStock?.quantity || 0}
                onChange={(e) => setEditingStock(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null)}
                placeholder="100"
              />
            </div>
            <Button onClick={handleEditStock} className="w-full">Update Stock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockOverview;
