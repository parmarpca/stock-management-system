import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Users, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StockOverview from "@/components/StockOverview";
import Layout from "@/components/Layout";
import { useStockData } from "@/hooks/useStockData";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    stocks,
    customers,
    orders,
    loading,
    createOrUpdateStock,
    deleteStock,
    fetchStocks,
  } = useStockData();

  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;
  const totalStockItems = stocks.length;
  const totalCustomers = customers.length;
  const todayOrders = orders.filter(
    (order) => order.order_date === new Date().toISOString().split("T")[0]
  ).length;

  const handleLowStockClick = () => {
    navigate("/stock?filter=low");
  };

  const handleTotalStockClick = () => {
    navigate("/stock");
  };

  if (loading) {
    return (
      <Layout title="Factory Stock Management" lowStockCount={0}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Factory Stock Management"
      lowStockCount={lowStockCount}
      onLowStockClick={handleLowStockClick}
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleTotalStockClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Total Stock Items
              </CardTitle>
              <Package className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg lg:text-2xl font-bold">
                {totalStockItems}
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleLowStockClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Low Stock Alerts
              </CardTitle>
              <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg lg:text-2xl font-bold text-red-600">
                {lowStockCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg lg:text-2xl font-bold">
                {totalCustomers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Today's Orders
              </CardTitle>
              <FileText className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg lg:text-2xl font-bold">{todayOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Overview */}
        <StockOverview
          onStockDelete={async (stockId) => {
            await deleteStock(stockId);
          }}
          onRefresh={async () => {
            await fetchStocks();
          }}
          stocks={stocks}
          showLowStockOnly={false}
          onStockCreate={createOrUpdateStock}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm lg:text-base">
                      {order.customer_name}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {order.order_items?.length || 0} items -{" "}
                      {order.color_code || "No color"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-sm lg:text-base">
                      {order.order_items?.reduce(
                        (total, item) => total + item.pieces_used,
                        0
                      ) || 0}{" "}
                      pieces total
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {order.order_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
