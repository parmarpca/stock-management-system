
import SlipManager from '@/components/SlipManager';
import Layout from '@/components/Layout';
import { useStockData } from '@/hooks/useStockData';

const OrderManagement = () => {
  const { stocks, customers, slips, setStocks, setCustomers, setSlips } = useStockData();
  const lowStockCount = stocks.filter(stock => stock.quantity < 50).length;

  const handleSlipCreation = (newSlip: Omit<any, 'id'>) => {
    const slip = {
      ...newSlip,
      id: Date.now().toString(),
    };
    
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.id === newSlip.stock_id 
          ? { ...stock, quantity: stock.quantity - newSlip.pieces_used, updated_at: new Date().toISOString().split('T')[0] }
          : stock
      )
    );
    
    setSlips(prevSlips => [slip, ...prevSlips]);
  };

  return (
    <Layout 
      title="Order Management" 
      lowStockCount={lowStockCount}
    >
      <SlipManager 
        stocks={stocks}
        customers={customers}
        slips={slips}
        onSlipCreate={handleSlipCreation}
        setCustomers={setCustomers}
      />
    </Layout>
  );
};

export default OrderManagement;
