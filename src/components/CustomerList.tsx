
import { useState } from 'react';
import { Users, Plus, User, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Customer {
  id: string;
  name: string;
  created_at: string;
}

interface CustomerListProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerList = ({ customers, setCustomers }: CustomerListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [newCustomer, setNewCustomer] = useState({
    name: ''
  });

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }

    const customer: Customer = {
      ...newCustomer,
      id: Date.now().toString(),
      created_at: new Date().toISOString().split('T')[0]
    };
    
    setCustomers(prev => [...prev, customer]);
    setNewCustomer({ name: '' });
    setIsAddDialogOpen(false);
  };

  const handleEditCustomer = () => {
    if (!editingCustomer || !editingCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }

    setCustomers(prev => 
      prev.map(customer => 
        customer.id === editingCustomer.id 
          ? { ...customer, name: editingCustomer.name }
          : customer
      )
    );
    setEditingCustomer(null);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl lg:text-2xl font-bold">Customer Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
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
                  className="w-full"
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
          className="w-full max-w-md"
        />
      </div>

      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                  <div className="p-2 lg:p-3 bg-blue-100 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm lg:text-lg truncate">{customer.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">Added: {customer.created_at}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEditDialog(customer)}
                  className="flex-shrink-0 ml-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-customer-name">Customer Name</Label>
              <Input
                id="edit-customer-name"
                value={editingCustomer?.name || ''}
                onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="ABC Construction"
                className="w-full"
              />
            </div>
            <Button onClick={handleEditCustomer} className="w-full">Update Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerList;
