import Layout from "@/components/Layout";
import BackupManager from "@/components/BackupManager";
import { useStockData } from "@/hooks/useStockData";

const BackupManagement = () => {
  const { stocks, loading } = useStockData();
  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;

  if (loading) {
    return (
      <Layout title="Backup Management" lowStockCount={lowStockCount}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Backup Management" lowStockCount={lowStockCount}>
      <BackupManager />
    </Layout>
  );
};

export default BackupManagement;
