
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockOverview from '@/components/StockOverview';
import Layout from '@/components/Layout';
import { useStockData } from '@/hooks/useStockData';

const StockManagement = () => {
  const [searchParams] = useSearchParams();
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const { stocks, setStocks } = useStockData();

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'low') {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);

  const lowStockCount = stocks.filter(stock => stock.quantity < 50).length;

  return (
    <Layout 
      title="Stock Management" 
      lowStockCount={lowStockCount}
    >
      <StockOverview 
        stocks={stocks} 
        setStocks={setStocks} 
        showLowStockOnly={showLowStockOnly}
        onFilterChange={setShowLowStockOnly}
      />
    </Layout>
  );
};

export default StockManagement;
