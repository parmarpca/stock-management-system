import Layout from "@/components/Layout";
import QuotationManager from "@/components/QuotationManager";
import { useQuotationData } from "@/hooks/useQuotationData";
import { useStockData } from "@/hooks/useStockData";
import { Loader2 } from "lucide-react";

const QuotationManagement = () => {
  const { stocks, loading: stocksLoading } = useStockData();
  const {
    quotations,
    customers,
    loading: quotationsLoading,
    fetchQuotations,
    createQuotation,
    updateQuotation,
    deleteQuotation,
  } = useQuotationData();

  if (stocksLoading || quotationsLoading) {
    return (
      <Layout title="Quotations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Quotations">
      <QuotationManager
        stocks={stocks}
        quotations={quotations}
        customers={customers}
        onQuotationCreate={createQuotation}
        onQuotationUpdate={updateQuotation}
        onQuotationDelete={deleteQuotation}
        fetchQuotations={fetchQuotations}
      />
    </Layout>
  );
};

export default QuotationManagement;
