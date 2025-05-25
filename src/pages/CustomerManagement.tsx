
import CustomerList from '@/components/CustomerList';
import Layout from '@/components/Layout';
import { useStockData } from '@/hooks/useStockData';

const CustomerManagement = () => {
  const { customers, setCustomers, stocks } = useStockData();
  const lowStockCount = stocks.filter(stock => stock.quantity < 50).length;

  return (
    <Layout 
      title="Customer Management" 
      lowStockCount={lowStockCount}
    >
      <CustomerList customers={customers} setCustomers={setCustomers} />
    </Layout>
  );
};

export default CustomerManagement;
