import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StockOverview from "@/components/StockOverview";
import Layout from "@/components/Layout";
import { useStockData } from "@/hooks/useStockData";

const StockManagement = () => {
  const [searchParams] = useSearchParams();
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const { stocks, loading, createOrUpdateStock } = useStockData();

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "low") {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);

  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;

  if (loading) {
    return (
      <Layout title="Stock Management" lowStockCount={0}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Stock Management" lowStockCount={lowStockCount}>
      <StockOverview
        stocks={stocks}
        showLowStockOnly={showLowStockOnly}
        onFilterChange={setShowLowStockOnly}
        onStockCreate={createOrUpdateStock}
      />
    </Layout>
  );
};

export default StockManagement;
