
import { useState } from 'react';
import { Users, Plus, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Customer {
  id: string;
  name: string;
  color_code: string;
  created_at: string;
}

interface CustomerListProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerList = ({ customers, setCustomers }: CustomerListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    color_code: ''
  });

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.color_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    const customer: Customer = {
      ...newCustomer,
      id: Date.now().toString(),
      created_at: new Date().toISOString().split('T')[0]
    };
    
    setCustomers(prev => [...prev, customer]);
    setNewCustomer({ name: '', color_code: '' });
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ABC Construction"
                />
              </div>
              <div>
                <Label htmlFor="color-code">Color Code</Label>
                <Input
                  id="color-code"
                  value={newCustomer.color_code}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, color_code: e.target.value }))}
                  placeholder="Blue"
                />
              </div>
              <Button onClick={handleAddCustomer} className="w-full">Add Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">Color Code:</span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: customer.color_code.toLowerCase() === 'blue' ? '#dbeafe' : 
                                       customer.color_code.toLowerCase() === 'red' ? '#fecaca' : 
                                       customer.color_code.toLowerCase() === 'green' ? '#dcfce7' : '#f3f4f6',
                        color: customer.color_code.toLowerCase() === 'blue' ? '#1e40af' : 
                               customer.color_code.toLowerCase() === 'red' ? '#dc2626' : 
                               customer.color_code.toLowerCase() === 'green' ? '#16a34a' : '#374151'
                      }}
                    >
                      {customer.color_code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Added: {customer.created_at}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;
