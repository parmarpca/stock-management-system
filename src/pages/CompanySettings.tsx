import Layout from "@/components/Layout";
import CompanySettings from "@/components/CompanySettings";
import { useStockData } from "@/hooks/useStockData";

const CompanySettingsPage = () => {
  const { stocks } = useStockData();
  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;

  return (
    <Layout title="Company Settings" lowStockCount={lowStockCount}>
      <CompanySettings />
    </Layout>
  );
};

export default CompanySettingsPage;
