import Layout from "@/components/Layout";
import UserManager from "@/components/UserManager";
import { useStockData } from "@/hooks/useStockData";

const UserManagement = () => {
  const { stocks, loading } = useStockData();
  const lowStockCount = stocks.filter((stock) => stock.quantity < 50).length;

  if (loading) {
    return (
      <Layout title="User Management" lowStockCount={lowStockCount}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Management" lowStockCount={lowStockCount}>
      <UserManager />
    </Layout>
  );
};

export default UserManagement;
