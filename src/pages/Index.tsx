
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { useStockData } from '@/hooks/useStockData';

const Index = () => {
  const navigate = useNavigate();
  const { stocks, customers, orders } = useStockData();
  
  const lowStockItems = stocks.filter(stock => stock.quantity < 50);
  const lowStockCount = lowStockItems.length;
  
  const totalStockValue = stocks.reduce((total, stock) => total + stock.quantity, 0);
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  return (
    <Layout title="Dashboard" lowStockCount={lowStockCount}>
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('/stock')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stocks.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalStockValue} total pieces
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('/customers')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active customers
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('/orders')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => navigate('/stock?filter=low')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Items below 50 pieces
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/orders')} 
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create New Order
              </Button>
              <Button 
                onClick={() => navigate('/customers')} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
              <Button 
                onClick={() => navigate('/stock')} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                Manage Stock
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                You have {lowStockCount} item(s) with low stock levels.
              </p>
              <div className="space-y-2">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-medium">{item.name} ({item.code})</span>
                    <span className="text-red-600 font-bold">{item.quantity} pieces</span>
                  </div>
                ))}
                {lowStockCount > 3 && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/stock?filter=low')}
                    className="w-full mt-2"
                  >
                    View All {lowStockCount} Low Stock Items
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
