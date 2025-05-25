
import { useState } from 'react';
import { Package, Plus, Edit, AlertTriangle } from 'lucide-react';
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
  location?: string;
  created_at: string;
  updated_at: string;
}

interface StockOverviewProps {
  stocks: Stock[];
  setStocks: React.Dispatch<React.SetStateAction<Stock[]>>;
}

const StockOverview = ({ stocks, setStocks }: StockOverviewProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newStock, setNewStock] = useState({
    name: '',
    code: '',
    length: '16ft' as '16ft' | '12ft',
    quantity: 0,
    location: ''
  });

  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStock = () => {
    const stock: Stock = {
      ...newStock,
      id: Date.now().toString(),
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };
    
    setStocks(prev => [...prev, stock]);
    setNewStock({ name: '', code: '', length: '16ft', quantity: 0, location: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditStock = (stock: Stock) => {
    setStocks(prev => prev.map(s => s.id === stock.id ? { ...stock, updated_at: new Date().toISOString().split('T')[0] } : s));
    setEditingStock(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newStock.location}
                  onChange={(e) => setNewStock(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Warehouse A"
                />
              </div>
              <Button onClick={handleAddStock} className="w-full">Add Stock</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
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
                    {stock.location && <p className="text-sm text-gray-500">Location: {stock.location}</p>}
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
                          <div>
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                              id="edit-location"
                              value={editingStock.location || ''}
                              onChange={(e) => setEditingStock(prev => prev ? ({ ...prev, location: e.target.value }) : null)}
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
