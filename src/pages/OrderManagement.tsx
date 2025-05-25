// import OrderManager from "@/components/OrderManager";
import Layout from "@/components/Layout";
import OrderManager from "@/components/OrderManager";
import { useStockData } from "@/hooks/useStockData";

const OrderManagement = () => {
  const {
    stocks,
    customers,
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
    createCustomer,
    fetchCustomers,
  } = useStockData();
  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;

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
        onCustomerCreate={createCustomer}
        fetchCustomers={fetchCustomers}
      />
    </Layout>
  );
};

export default OrderManagement;
