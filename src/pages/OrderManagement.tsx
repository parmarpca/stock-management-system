// import OrderManager from "@/components/OrderManager";
import Layout from "@/components/Layout";
import OrderManager from "@/components/OrderManager";
import { useStockData } from "@/hooks/useStockData";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const OrderManagement = () => {
  const {
    stocks,
    customers,
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
    hideOrder,
    showOrder,
    createCustomer,
    fetchCustomers,
    fetchOrders,
  } = useStockData();
  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const filterCustomer = searchParams.get("customer");
  useEffect(() => {
    setSearchTerm(filterCustomer || "all");
  }, [filterCustomer]);

  if (loading) {
    return (
      <Layout title="Order Management" lowStockCount={lowStockCount}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Order Management" lowStockCount={lowStockCount}>
      <OrderManager
        stocks={stocks}
        customers={customers}
        orders={orders}
        onOrderCreate={createOrder}
        onOrderUpdate={updateOrder}
        onOrderDelete={deleteOrder}
        onOrderHide={hideOrder}
        onOrderShow={showOrder}
        onCustomerCreate={createCustomer}
        fetchCustomers={fetchCustomers}
        fetchOrders={fetchOrders}
        filterCustomer={searchTerm}
        setFilterCustomer={setSearchTerm}
      />
    </Layout>
  );
};

export default OrderManagement;
