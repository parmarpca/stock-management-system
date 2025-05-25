
import { useState, useEffect } from 'react';
import { Package, Users, FileText, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StockOverview from '@/components/StockOverview';
import CustomerList from '@/components/CustomerList';
import SlipManager from '@/components/SlipManager';
import OrderForm from '@/components/OrderForm';
import LoginForm from '@/components/LoginForm';
import Sidebar from '@/components/Sidebar';

// Mock data structures
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

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: '1',
      name: 'Steel Rebar',
      code: 'SR001',
      length: '16ft',
      quantity: 25,
      created_at: '2024-01-15',
      updated_at: '2024-05-25'
    },
    {
      id: '2',
      name: 'Steel Rebar',
      code: 'SR002',
      length: '12ft',
      quantity: 75,
      created_at: '2024-01-15',
      updated_at: '2024-05-25'
    },
    {
      id: '3',
      name: 'Iron Rod',
      code: 'IR001',
      length: '16ft',
      quantity: 15,
      created_at: '2024-02-10',
      updated_at: '2024-05-25'
    },
    {
      id: '4',
      name: 'Aluminum Pipe',
      code: 'AP001',
      length: '12ft',
      quantity: 120,
      created_at: '2024-03-05',
      updated_at: '2024-05-25'
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'ABC Construction',
      color_code: 'Blue',
      created_at: '2024-01-10'
    },
    {
      id: '2',
      name: 'XYZ Builders',
      color_code: 'Red',
      created_at: '2024-02-15'
    },
    {
      id: '3',
      name: 'Metro Infrastructure',
      color_code: 'Green',
      created_at: '2024-03-20'
    }
  ]);

  const [slips, setSlips] = useState<Slip[]>([
    {
      id: '1',
      customer_id: '1',
      stock_id: '1',
      length: '16ft',
      pieces_used: 10,
      date: '2024-05-24',
      customer_name: 'ABC Construction',
      stock_name: 'Steel Rebar'
    },
    {
      id: '2',
      customer_id: '2',
      stock_id: '2',
      length: '12ft',
      pieces_used: 5,
      date: '2024-05-23',
      customer_name: 'XYZ Builders',
      stock_name: 'Steel Rebar'
    }
  ]);

  // Calculate statistics
  const lowStockCount = stocks.filter(stock => stock.quantity < 50).length;
  const totalStockItems = stocks.length;
  const totalCustomers = customers.length;
  const todaySlips = slips.filter(slip => slip.date === new Date().toISOString().split('T')[0]).length;

  const handleSlipCreation = (newSlip: Omit<Slip, 'id'>) => {
    const slip: Slip = {
      ...newSlip,
      id: Date.now().toString(),
    };
    
    // Update stock quantity
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.id === newSlip.stock_id 
          ? { ...stock, quantity: stock.quantity - newSlip.pieces_used, updated_at: new Date().toISOString().split('T')[0] }
          : stock
      )
    );
    
    setSlips(prevSlips => [slip, ...prevSlips]);
  };

  const handleOrderCreation = (orderData: any) => {
    handleSlipCreation(orderData);
  };

  const handleLowStockClick = () => {
    setActiveTab('stock');
    setShowLowStockOnly(true);
  };

  const handleTotalStockClick = () => {
    setActiveTab('stock');
    setShowLowStockOnly(false);
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleTotalStockClick}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockItems}</div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleLowStockClick}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Slips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySlips}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview */}
      <StockOverview stocks={stocks} setStocks={setStocks} showLowStockOnly={false} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Slips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slips.slice(0, 5).map((slip) => (
              <div key={slip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{slip.customer_name}</p>
                  <p className="text-sm text-gray-600">{slip.stock_name} - {slip.length}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{slip.pieces_used} pieces</p>
                  <p className="text-sm text-gray-600">{slip.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Factory Stock Management System
            </h1>
            <div className="flex items-center space-x-2">
              {lowStockCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="flex items-center space-x-1 cursor-pointer"
                  onClick={handleLowStockClick}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline">{lowStockCount} Low Stock</span>
                  <span className="sm:hidden">{lowStockCount}</span>
                </Badge>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'stock' && <StockOverview stocks={stocks} setStocks={setStocks} showLowStockOnly={showLowStockOnly} />}
          {activeTab === 'customers' && <CustomerList customers={customers} setCustomers={setCustomers} />}
          {activeTab === 'slips' && <SlipManager stocks={stocks} customers={customers} slips={slips} onSlipCreate={handleSlipCreation} />}
          {activeTab === 'orders' && <OrderForm stocks={stocks} customers={customers} setCustomers={setCustomers} onOrderCreate={handleOrderCreation} />}
        </main>
      </div>
    </div>
  );
};

export default Index;
