import { useState } from "react";
import {
  FileText,
  Plus,
  Printer,
  Edit,
  Trash2,
  Loader2,
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Stock } from "@/hooks/useStockData";
import {
  Quotation,
  QuotationItemForm,
  QuotationAdditionalCostForm,
  Customer,
} from "@/hooks/useQuotationData";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { cn } from "@/lib/utils";
import { COMPANY_INFO } from "@/constants/company";
import { stockLength } from "@/constants/config";

interface QuotationManagerProps {
  stocks: Stock[];
  quotations: Quotation[];
  customers: Customer[];
  onQuotationCreate: (
    customerName: string,
    customerAddress: string,
    customerGstin: string,
    quotationDate: string,
    items: QuotationItemForm[],
    additionalCosts: QuotationAdditionalCostForm[],
    gstEnabled: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage?: number,
    showUnitPrice?: boolean
  ) => Promise<Quotation>;
  onQuotationUpdate: (
    quotationId: string,
    customerName: string,
    customerAddress: string,
    customerGstin: string,
    quotationDate: string,
    items: QuotationItemForm[],
    additionalCosts: QuotationAdditionalCostForm[],
    gstEnabled: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage?: number,
    showUnitPrice?: boolean
  ) => Promise<void>;
  onQuotationDelete: (quotationId: string) => Promise<void>;
  fetchQuotations: (showTodayOnly?: boolean) => Promise<void>;
}

const QuotationManager = ({
  stocks,
  quotations,
  customers,
  onQuotationCreate,
  onQuotationUpdate,
  onQuotationDelete,
}: QuotationManagerProps) => {
  const dynamicLengthOptions = Array.from(new Set(stocks.map(s => s.length).filter(Boolean))).sort();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(
    null
  );
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null
  );

  // Filter states
  const [showQuotationsList, setShowQuotationsList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPricesInList, setShowPricesInList] = useState(false);
  const [showFinalPriceInList, setShowFinalPriceInList] = useState(true);

  // Form states
  const [customerInput, setCustomerInput] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [quotationItems, setQuotationItems] = useState<QuotationItemForm[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<
    QuotationAdditionalCostForm[]
  >([]);

  // GST settings
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstType, setGstType] = useState<"CGST_SGST" | "IGST" | "UTGST">(
    "CGST_SGST"
  );
  const [gstPercentage, setGstPercentage] = useState(18);
  const [showUnitPrice, setShowUnitPrice] = useState(false);

  // Current item being added
  const [stockSearch, setStockSearch] = useState("");
  const [stockLengthFilter, setStockLengthFilter] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [pieces, setPieces] = useState(0);
  const [pricePerPiece, setPricePerPiece] = useState(0);
  const [itemWeight, setItemWeight] = useState<number | undefined>(undefined);
  const [rateType, setRateType] = useState<"per_kg" | "per_pc">("per_kg");
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [selectedStockIndex, setSelectedStockIndex] = useState(-1);

  // Manual item states
  const [isManualItem, setIsManualItem] = useState(false);
  const [manualStockName, setManualStockName] = useState("");
  const [manualStockCode, setManualStockCode] = useState("");
  const [manualLength, setManualLength] = useState<stockLength>("");

  // Additional cost states
  const [costLabel, setCostLabel] = useState("");
  const [costType, setCostType] = useState<"add" | "discount">("add");
  const [costAmount, setCostAmount] = useState(0);

  // Print dialog states
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [quotationToPrint, setQuotationToPrint] = useState<Quotation | null>(
    null
  );

  const { companySettings } = useCompanySettings();

  // Use company settings from database, fallback to constants
  const companyInfo = companySettings
    ? {
      name: companySettings.company_name,
      address: companySettings.company_address,
      gstin: companySettings.company_gstin,
      phone: companySettings.company_phone,
      email: companySettings.company_email,
      website: companySettings.company_website,
    }
    : COMPANY_INFO;

  const filteredStocks = stocks.filter(
    (stock) =>
      (stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        stock.code.toLowerCase().includes(stockSearch.toLowerCase())) &&
      (stockLengthFilter === "all" || stock.length === stockLengthFilter)
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerInput.toLowerCase())
  );

  const filteredQuotations = quotations.filter(
    (quotation) =>
      quotation.customer_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      quotation.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleQuotationsList = async () => {
    const newShowList = !showQuotationsList;
    setShowQuotationsList(newShowList);
    if (newShowList) {
      await fetchQuotations(false); // Fetch all when "show list" is clicked
    }
  };

  const handleCustomerInputChange = (value: string) => {
    setCustomerInput(value);
    setShowCustomerSuggestions(true);
    setSelectedCustomerIndex(-1);

    // Check if input matches existing customer
    const matchingCustomer = customers.find(
      (customer) => customer.name.toLowerCase() === value.toLowerCase()
    );
    setSelectedCustomer(matchingCustomer || null);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerInput(customer.name);
    setCustomerAddress(customer.address || "");
    setCustomerGstin(customer.gstin_number || "");
    setSelectedCustomer(customer);
    setShowCustomerSuggestions(false);
    setSelectedCustomerIndex(-1);
  };

  // Handle keyboard navigation for customer suggestions
  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!showCustomerSuggestions || filteredCustomers.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        // Move to next field (quotation date)
        const quotationDateInput = document.getElementById("quotation-date");
        if (quotationDateInput) quotationDateInput.focus();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedCustomerIndex((prev) => {
          const newIndex =
            prev < filteredCustomers.length - 1 ? prev + 1 : prev;
          // Scroll to selected item
          setTimeout(() => {
            const selectedElement = document.querySelector(
              `[data-customer-index="${newIndex}"]`
            );
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedCustomerIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          // Scroll to selected item
          setTimeout(() => {
            const selectedElement = document.querySelector(
              `[data-customer-index="${newIndex}"]`
            );
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedCustomerIndex >= 0) {
          handleCustomerSelect(filteredCustomers[selectedCustomerIndex]);
        } else if (filteredCustomers.length > 0) {
          handleCustomerSelect(filteredCustomers[0]);
        } else if (customerInput.trim()) {
          // Create new customer entry
          const newCustomer: Customer = {
            id: "new",
            name: customerInput.trim(),
            created_at: new Date().toISOString(),
          };
          setSelectedCustomer(newCustomer);
          setShowCustomerSuggestions(false);
        }
        // Move to next field after selection
        setTimeout(() => {
          const quotationDateInput = document.getElementById("quotation-date");
          if (quotationDateInput) quotationDateInput.focus();
        }, 100);
        break;
      case "Escape":
        setShowCustomerSuggestions(false);
        setSelectedCustomerIndex(-1);
        break;
    }
  };

  // const handleStockSelect = (stock: Stock) => {
  //   setSelectedStock(stock);
  //   setStockSearch(`${stock.name} (${stock.code}) - ${stock.length}`);
  //   setShowStockSuggestions(false);
  //   setSelectedStockIndex(-1);
  //   setIsManualItem(false);
  //   setItemWeight(stock.weight);

  //   // Focus on pieces input after stock selection
  //   setTimeout(() => {
  //     const piecesInput = document.getElementById("pieces-input");
  //     if (piecesInput) piecesInput.focus();
  //   }, 100);
  // };

  const addItemToQuotation = () => {
    const stockName = isManualItem ? manualStockName : selectedStock?.name;
    const stockCode = isManualItem ? manualStockCode : selectedStock?.code;
    const length = isManualItem ? manualLength : selectedStock?.length;

    if (!stockName || !stockCode || pieces <= 0 || pricePerPiece <= 0) {
      alert("Please fill all item fields");
      return;
    }

    const newItem: QuotationItemForm = {
      stock_name: stockName,
      stock_code: stockCode,
      length: length as stockLength,
      pieces,
      price_per_piece: pricePerPiece,
      is_from_stock_table: !isManualItem,
      rate_type: rateType,
      stock_id: selectedStock?.id,
      weight: itemWeight,
    };

    setQuotationItems([...quotationItems, newItem]);

    // Reset item inputs
    setStockSearch("");
    setSelectedStock(null);
    setPieces(0);
    setPricePerPiece(0);
    setItemWeight(undefined);
    setRateType("per_kg");
    setIsManualItem(false);
    setManualStockName("");
    setManualStockCode("");

    // Focus back to stock search or manual toggle
    const searchInput = document.getElementById("stock-search-input");
    if (searchInput) searchInput.focus();
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setStockSearch(`${stock.name} (${stock.code}) - ${stock.length}`);
    setShowStockSuggestions(false);
    setSelectedStockIndex(-1);
    setIsManualItem(false);
    setItemWeight(stock.weight);

    // Focus on pieces input after stock selection
    setTimeout(() => {
      const piecesInput = document.getElementById("pieces-input");
      if (piecesInput) piecesInput.focus();
    }, 100);
  };

  // Handle Enter key for adding items
  const handleItemKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (field === "stock-search") {
        if (selectedStockIndex >= 0 && filteredStocks.length > 0) {
          handleStockSelect(filteredStocks[selectedStockIndex]);
        } else if (filteredStocks.length > 0) {
          handleStockSelect(filteredStocks[0]);
        }
        return;
      }

      if (field === "pieces") {
        const priceInput = document.getElementById("price-input");
        if (priceInput) priceInput.focus();
        return;
      }

      if (field === "price" || field === "manual-stock-code") {
        // Try to add the item
        if (
          (isManualItem &&
            manualStockName &&
            manualStockCode &&
            pieces > 0 &&
            pricePerPiece > 0) ||
          (!isManualItem && selectedStock && pieces > 0 && pricePerPiece > 0)
        ) {
          addItemToQuotation();
        }
        return;
      }

      if (field === "manual-stock-name") {
        const codeInput = document.getElementById("manual-stock-code-input");
        if (codeInput) codeInput.focus();
        return;
      }
    }

    // Handle arrow keys for stock search
    if (field === "stock-search") {
      handleStockKeyDown(e);
    }
  };

  const removeItemFromQuotation = (index: number) => {
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  };

  const addAdditionalCost = () => {
    if (!costLabel || costAmount <= 0) {
      alert("Please enter valid cost details");
      return;
    }

    const newCost: QuotationAdditionalCostForm = {
      label: costLabel,
      type: costType,
      amount: costAmount,
    };

    setAdditionalCosts([...additionalCosts, newCost]);
    setCostLabel("");
    setCostAmount(0);
  };

  const removeAdditionalCost = (index: number) => {
    setAdditionalCosts(additionalCosts.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    // Calculate subtotal based on weight and price per piece
    const subtotal = quotationItems.reduce((sum, item) => {
      const itemWeight = item.weight || 0;
      const totalWeight = itemWeight * item.pieces;
      const itemAmount =
        item.rate_type === "per_kg" && itemWeight > 0
          ? totalWeight * item.price_per_piece
          : item.pieces * item.price_per_piece;
      return sum + itemAmount;
    }, 0);

    const additionalTotal = additionalCosts.reduce(
      (sum, cost) => sum + (cost.type === "add" ? cost.amount : -cost.amount),
      0
    );

    const baseTotal = subtotal + additionalTotal;
    const gstAmount = gstEnabled ? (baseTotal * gstPercentage) / 100 : 0;
    const rawFinalTotal = baseTotal + gstAmount;

    // Round up/down logic
    const roundedFinalTotal =
      rawFinalTotal % 1 >= 0.5
        ? Math.ceil(rawFinalTotal)
        : Math.floor(rawFinalTotal);

    const roundingAdjustment = roundedFinalTotal - rawFinalTotal;

    return {
      subtotal,
      additionalTotal,
      gstAmount,
      finalTotal: roundedFinalTotal,
      roundingAdjustment,
      rawFinalTotal,
    };
  };

  const resetForm = () => {
    setCustomerInput("");
    setCustomerAddress("");
    setCustomerGstin("");
    setSelectedCustomer(null);
    setShowCustomerSuggestions(false);
    setSelectedCustomerIndex(-1);
    setQuotationDate(new Date().toISOString().split("T")[0]);
    setQuotationItems([]);
    setAdditionalCosts([]);
    setGstEnabled(false);
    setGstType("CGST_SGST");
    setGstPercentage(18);
    setShowUnitPrice(false);
    setStockSearch("");
    setStockLengthFilter("all");
    setSelectedStock(null);
    setPieces(0);
    setPricePerPiece(0);
    setItemWeight(undefined);
    setIsManualItem(false);
    setManualStockName("");
    setManualStockCode("");
    setManualLength("");
    setCostLabel("");
    setCostType("add");
    setCostAmount(0);
  };

  const handleCreateQuotation = async () => {
    if (!customerInput.trim() || quotationItems.length === 0) {
      alert("Please enter customer name and add at least one item");
      return;
    }

    setIsCreatingQuotation(true);
    try {
      const result = await onQuotationCreate(
        customerInput.trim(),
        customerAddress,
        customerGstin,
        quotationDate,
        quotationItems,
        additionalCosts,
        gstEnabled,
        gstType,
        gstPercentage,
        showUnitPrice
      );
      setCreatedQuotation(result);
      setShowSuccessDialog(true);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating quotation:", error);
      alert("Error creating quotation. Please try again.");
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setCustomerInput(quotation.customer_name);
    setCustomerAddress(quotation.customer_address || "");
    setCustomerGstin(quotation.customer_gstin || "");
    setQuotationDate(quotation.quotation_date);
    setQuotationItems(
      quotation.quotation_items?.map((item) => ({
        stock_name: item.stock_name,
        stock_code: item.stock_code,
        length: item.length,
        pieces: item.pieces,
        price_per_piece: item.price_per_piece,
        is_from_stock_table: item.is_from_stock_table,
        rate_type: item.rate_type,
        stock_id: item.stock_id,
        weight: item.weight,
      })) || []
    );
    setAdditionalCosts(
      quotation.quotation_additional_costs?.map((cost) => ({
        label: cost.label,
        type: cost.type,
        amount: cost.amount,
      })) || []
    );
    setGstEnabled(quotation.gst_enabled);
    setGstType(quotation.gst_type || "CGST_SGST");
    setGstPercentage(quotation.gst_percentage);
    setShowUnitPrice(quotation.show_unit_price);
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuotation = async () => {
    if (
      !editingQuotation ||
      !customerInput.trim() ||
      quotationItems.length === 0
    ) {
      alert("Please enter customer name and add at least one item");
      return;
    }

    setIsCreatingQuotation(true);
    try {
      await onQuotationUpdate(
        editingQuotation.id,
        customerInput.trim(),
        customerAddress,
        customerGstin,
        quotationDate,
        quotationItems,
        additionalCosts,
        gstEnabled,
        gstType,
        gstPercentage,
        showUnitPrice
      );
      setIsEditDialogOpen(false);
      resetForm();
      setEditingQuotation(null);
    } catch (error) {
      console.error("Error updating quotation:", error);
      alert("Error updating quotation. Please try again.");
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      try {
        await onQuotationDelete(quotationId);
      } catch (error) {
        console.error("Error deleting quotation:", error);
        alert("Error deleting quotation. Please try again.");
      }
    }
  };

  const handlePrintQuotation = (quotation: Quotation, showPrices: boolean) => {
    const colSpan = showPrices ? 8 : 7;
    const priceHeader = showPrices
      ? `<th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:12%;font-weight:bold;">Rate</th>
         <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:12%;font-weight:bold;">Amount</th>`
      : "";

    const itemRows = (quotation.quotation_items ?? [])
      .map((item, index) => {
        const iw = item.weight || 0;
        const nw = iw * item.pieces;
        const rt = item.rate_type ?? "per_kg";
        const rate = Number(item.price_per_piece ?? 0);
        const amount = rt === "per_kg" ? rate * nw : rate * item.pieces;
        const rateLabel = rt === "per_kg" ? `₹${rate.toFixed(2)}/kg` : `₹${rate.toFixed(2)}/pc`;
        const priceCell = showPrices
          ? `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${rateLabel}</td>
             <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">₹${amount.toFixed(2)}</td>`
          : "";
        return `
          <tr>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${index + 1}</td>
            <td style="border:1px solid #000;padding:4px;font-size:12px;">${item.stock_name}</td>
            <td style="border:1px solid #000;padding:4px;font-size:12px;">${item.stock_code || "N/A"}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${item.length || "-"}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${item.pieces}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${nw > 0 ? nw.toFixed(3) : "-"}</td>
            ${priceCell}
          </tr>`;
      })
      .join("") || `<tr><td colspan="${colSpan}" style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">No items</td></tr>`;

    const totalPcs = (quotation.quotation_items ?? []).reduce((s, i) => s + i.pieces, 0);
    const totalNW = (quotation.quotation_items ?? []).reduce((s, i) => s + (i.weight || 0) * i.pieces, 0);
    const subtotalCell = showPrices
      ? `<td colspan="2" style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;font-weight:bold;">₹${quotation.subtotal?.toFixed(2) ?? "0.00"}</td>`
      : "";

    const additionalCostRows = showPrices
      ? (quotation.quotation_additional_costs ?? [])
        .map(
          (c) =>
            `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">${c.label}</td>
               <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">${c.type === "discount" ? "-" : "+"}₹${Number(c.amount).toFixed(2)}</td></tr>`
        )
        .join("")
      : "";

    const gstRows = showPrices && quotation.gst_enabled
      ? `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;font-weight:bold;">Subtotal</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;font-weight:bold;">₹${quotation.raw_total?.toFixed(2) ?? "0.00"}</td></tr>
         <tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">GST (${quotation.gst_percentage ?? 0}%)</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">₹${quotation.gst_amount?.toFixed(2) ?? "0.00"}</td></tr>`
      : "";

    const roundRow = showPrices && quotation.rounding_adjustment
      ? `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">Round Off</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">${quotation.rounding_adjustment > 0 ? "+" : ""}₹${quotation.rounding_adjustment.toFixed(2)}</td></tr>`
      : "";

    const totalsBlock = showPrices
      ? `<div style="width:40%;float:right;margin-top:10px;">
           <table style="width:100%;border-collapse:collapse;font-size:11px;">
             ${additionalCostRows}${gstRows}${roundRow}
             <tr><td style="padding:5px 3px;font-weight:bold;border-top:2px solid #000;">Grand Total</td>
               <td style="padding:5px 3px;font-weight:bold;text-align:right;border-top:2px solid #000;">₹${quotation.total_amount?.toFixed(2) ?? "0.00"}</td></tr>
           </table>
           <div style="clear:both;"></div>
         </div>
         <div style="clear:both;"></div>`
      : "";

    const html = `<!DOCTYPE html><html><head><title>Quotation - ${quotation.customer_name}</title>
      <style>
        @media print { body{margin:0} @page{size:A4;margin:10mm} button{display:none} }
        body{font-family:Arial,sans-serif;background:#fff;color:#000;font-size:12px;}
        table{page-break-inside:avoid;}
      </style></head><body>
      <div style="max-width:800px;margin:0 auto;padding:15px;">
        <div style="text-align:center;margin-bottom:20px;border-bottom:1px solid #000;padding-bottom:10px;">
          ${companyInfo ? `<h1 style="margin:0;font-size:24px;font-weight:bold;">${companyInfo.name}</h1>
          <p style="margin:2px 0;font-size:11px;">${companyInfo.address}</p>
          <p style="margin:2px 0;font-size:11px;">GSTIN: ${companyInfo.gstin}</p>` : ""}
          <h2 style="margin:10px 0 0;font-size:18px;font-weight:bold;text-decoration:underline;">QUOTATION</h2>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
          <div style="width:48%;">
            <h3 style="margin:7px 0 5px;font-size:13px;font-weight:bold;">Customer Details:</h3>
            <p style="margin:2px 0;font-size:11px;"><strong>Name:</strong> ${quotation.customer_name}</p>
            ${quotation.customer_address ? `<p style="margin:2px 0;font-size:11px;"><strong>Address:</strong> ${quotation.customer_address}</p>` : ""}
            ${quotation.customer_gstin ? `<p style="margin:2px 0;font-size:11px;"><strong>GSTIN:</strong> ${quotation.customer_gstin}</p>` : ""}
          </div>
          <div style="width:48%;text-align:right;">
            <h3 style="margin:0 0 5px;font-size:13px;font-weight:bold;">Quotation Details:</h3>
            <p style="margin:2px 0;font-size:11px;"><strong>Quotation No:</strong> #${quotation.quotation_number}</p>
            <p style="margin:2px 0;font-size:11px;"><strong>Date:</strong> ${new Date(quotation.quotation_date).toLocaleDateString()}</p>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;border:1px solid #000;">
          <thead>
            <tr>
              <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:4%;font-weight:bold;">Sr.</th>
              <th style="border:1px solid #000;padding:4px;text-align:left;font-size:12px;width:30%;font-weight:bold;">Item Name</th>
              <th style="border:1px solid #000;padding:4px;text-align:left;font-size:12px;width:8%;font-weight:bold;">Code</th>
              <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:10%;font-weight:bold;">Length</th>
              <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:6%;font-weight:bold;">Pcs</th>
              <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:10%;font-weight:bold;">Net Wt.(kg)</th>
              ${priceHeader}
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="border:1px solid #000;padding:3px;text-align:right;font-size:10px;font-weight:bold;">Total:</td>
              <td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;font-weight:bold;">${totalPcs} pcs</td>
              <td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;font-weight:bold;">${totalNW.toFixed(3)} kg</td>
              ${subtotalCell}
            </tr>
          </tfoot>
        </table>
        ${totalsBlock}
        <div style="margin-top:15px;text-align:center;font-size:10px;color:#666;">
          Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
      </div>
    </body></html>`;

    // Print via hidden iframe — no new tab/window
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:none;";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  };

  const handleSuccessDialogPrint = async () => {
    if (!createdQuotation) return;

    try {
      // Find the complete quotation data with items from the quotations list
      const completeQuotation = quotations.find(
        (q) => q.id === createdQuotation.id
      );
      if (completeQuotation) {
        handlePrintQuotation(completeQuotation, showUnitPrice);
      } else {
        // Fallback: try to print with the created quotation data
        handlePrintQuotation(createdQuotation, showUnitPrice);
      }
    } catch (error) {
      console.error("Error printing quotation:", error);
      alert("Error printing quotation. Please try again.");
    }
  };

  const totals = calculateTotals();

  // Handle keyboard navigation for stock suggestions
  const handleStockKeyDown = (e: React.KeyboardEvent) => {
    if (!showStockSuggestions || filteredStocks.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedStockIndex((prev) => {
          const newIndex = prev < filteredStocks.length - 1 ? prev + 1 : prev;
          // Scroll to selected item
          setTimeout(() => {
            const selectedElement = document.querySelector(
              `[data-stock-index="${newIndex}"]`
            );
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedStockIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          // Scroll to selected item
          setTimeout(() => {
            const selectedElement = document.querySelector(
              `[data-stock-index="${newIndex}"]`
            );
            if (selectedElement) {
              selectedElement.scrollIntoView({ block: "nearest" });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedStockIndex >= 0) {
          handleStockSelect(filteredStocks[selectedStockIndex]);
        } else if (filteredStocks.length > 0) {
          handleStockSelect(filteredStocks[0]);
        }
        break;
      case "Escape":
        setShowStockSuggestions(false);
        setSelectedStockIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quotation Management
          </h2>
          <p className="text-muted-foreground">
            Create and manage customer quotations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showQuotationsList ? "default" : "outline"}
            onClick={toggleQuotationsList}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>{showQuotationsList ? "Hide Quotations" : "Show Quotations List"}</span>
          </Button>
          <Button
            variant={showPricesInList ? "default" : "outline"}
            onClick={() => setShowPricesInList(!showPricesInList)}
            className="flex items-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>{showPricesInList ? "Hide" : "Show"} Prices</span>
          </Button>
          <Button
            variant={showFinalPriceInList ? "default" : "outline"}
            onClick={() => setShowFinalPriceInList(!showFinalPriceInList)}
            className="flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>{showFinalPriceInList ? "Hide" : "Show"} Final Prices</span>
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quotation</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label htmlFor="customer-input">Customer Name</Label>
                        <Input
                          id="customer-input"
                          value={customerInput}
                          onChange={(e) =>
                            handleCustomerInputChange(e.target.value)
                          }
                          onKeyDown={handleCustomerKeyDown}
                          onFocus={() => setShowCustomerSuggestions(true)}
                          placeholder="Enter customer name"
                          autoComplete="off"
                        />
                        {showCustomerSuggestions &&
                          customerInput &&
                          filteredCustomers.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                              {filteredCustomers
                                .slice(0, 5)
                                .map((customer, index) => (
                                  <div
                                    key={customer.id}
                                    data-customer-index={index}
                                    className={cn(
                                      "p-2 cursor-pointer",
                                      index === selectedCustomerIndex
                                        ? "bg-blue-100"
                                        : "hover:bg-gray-100"
                                    )}
                                    onClick={() =>
                                      handleCustomerSelect(customer)
                                    }
                                  >
                                    {customer.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        {customerInput && !selectedCustomer && (
                          <p className="text-sm text-blue-600 mt-1">
                            New customer "{customerInput}" will be created
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="quotation-date">Date</Label>
                        <Input
                          id="quotation-date"
                          type="date"
                          value={quotationDate}
                          onChange={(e) => setQuotationDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer-address">
                          Customer Address
                        </Label>
                        <Input
                          id="customer-address"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Enter customer address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-gstin">Customer GSTIN</Label>
                        <Input
                          id="customer-gstin"
                          value={customerGstin}
                          onChange={(e) => setCustomerGstin(e.target.value)}
                          placeholder="Enter customer GSTIN"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manual-item"
                        checked={isManualItem}
                        onCheckedChange={setIsManualItem}
                      />
                      <Label htmlFor="manual-item">
                        Add manual item (not from stock)
                      </Label>
                    </div>

                    {isManualItem ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Stock Name</Label>
                          <Input
                            value={manualStockName}
                            onChange={(e) => setManualStockName(e.target.value)}
                            placeholder="Enter stock name"
                            id="manual-stock-name-input"
                            onKeyDown={(e) =>
                              handleItemKeyDown(e, "manual-stock-name")
                            }
                          />
                        </div>
                        <div>
                          <Label>Stock Code</Label>
                          <Input
                            value={manualStockCode}
                            onChange={(e) => setManualStockCode(e.target.value)}
                            placeholder="Enter stock code"
                            id="manual-stock-code-input"
                            onKeyDown={(e) =>
                              handleItemKeyDown(e, "manual-stock-code")
                            }
                          />
                        </div>
                        <div>
                          <Label>Length</Label>
                          <Input
                            list="manual-length-options"
                            value={manualLength}
                            onChange={(e) => setManualLength(e.target.value)}
                            onBlur={() => {
                              const val = manualLength.trim();
                              if (val) {
                                if (/^[\d\s\.\/\-]+$/.test(val)) {
                                  setManualLength(val + "ft");
                                } else if (/^[\d\s\.\/\-]+f$/i.test(val)) {
                                  setManualLength(val + "t");
                                }
                              }
                            }}
                            placeholder="e.g. 16"
                            autoComplete="off"
                          />
                          <datalist id="manual-length-options">
                            {dynamicLengthOptions.map((length) => (
                              <option key={length} value={length} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-36">
                            <Label htmlFor="create-stock-length-filter">Length</Label>
                            <Select
                              value={stockLengthFilter}
                              onValueChange={(v) => {
                                setStockLengthFilter(v);
                                setSelectedStock(null);
                                setShowStockSuggestions(true);
                              }}
                            >
                              <SelectTrigger id="create-stock-length-filter">
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All lengths</SelectItem>
                                {dynamicLengthOptions.map((l) => (
                                  <SelectItem key={l} value={l}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="relative flex-1">
                            <Label>Search Stock</Label>
                            <Input
                              value={stockSearch}
                              onChange={(e) => {
                                setStockSearch(e.target.value);
                                setShowStockSuggestions(true);
                              }}
                              placeholder="Search by name or code..."
                              id="stock-search-input"
                              onKeyDown={(e) =>
                                handleItemKeyDown(e, "stock-search")
                              }
                            />
                          </div>
                        </div>
                        {showStockSuggestions &&
                          filteredStocks.length > 0 &&
                          stockSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredStocks
                                .slice(0, 10)
                                .map((stock, index) => (
                                  <div
                                    key={stock.id}
                                    data-stock-index={index}
                                    className={cn(
                                      "px-4 py-2 cursor-pointer hover:bg-gray-50",
                                      index === selectedStockIndex &&
                                      "bg-blue-50"
                                    )}
                                    onClick={() => handleStockSelect(stock)}
                                  >
                                    <div className="font-medium">
                                      {stock.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {stock.code} - {stock.length} - Qty:{" "}
                                      {stock.quantity}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <Label>Pieces</Label>
                        <Input
                          type="number"
                          value={pieces || ""}
                          onChange={(e) => setPieces(Number(e.target.value))}
                          placeholder="0"
                          min="1"
                          id="pieces-input"
                          onKeyDown={(e) => handleItemKeyDown(e, "pieces")}
                        />
                      </div>
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={itemWeight || ""}
                          onChange={(e) =>
                            setItemWeight(Number(e.target.value) || undefined)
                          }
                          placeholder={
                            selectedStock?.weight
                              ? `${selectedStock.weight} (from stock)`
                              : "Enter weight"
                          }
                          min="0"
                          disabled={
                            selectedStock?.weight !== undefined &&
                            selectedStock?.weight !== 0 &&
                            selectedStock?.weight !== null &&
                            !isManualItem
                          }
                        />
                      </div>
                      <div>
                        <Label>Rate Type</Label>
                        <Select
                          value={rateType}
                          onValueChange={(value: "per_kg" | "per_pc") =>
                            setRateType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_kg">Per Kg</SelectItem>
                            <SelectItem value="per_pc">Per Piece</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>
                          {rateType === "per_kg"
                            ? "Rate per Kg (₹)"
                            : "Price per Piece (₹)"}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pricePerPiece || ""}
                          onChange={(e) =>
                            setPricePerPiece(Number(e.target.value))
                          }
                          placeholder="0.00"
                          min="0"
                          id="price-input"
                          onKeyDown={(e) => handleItemKeyDown(e, "price")}
                        />
                      </div>
                      <div className="flex items-end col-span-2 md:col-span-1">
                        <Button onClick={addItemToQuotation} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Added Items */}
                {quotationItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Added Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {quotationItems.map((item, index) => {
                          const itemWeight = item.weight || 0;
                          const totalWeight = itemWeight * item.pieces;
                          const itemTotal =
                            item.rate_type === "per_kg" && itemWeight > 0
                              ? totalWeight * item.price_per_piece
                              : item.pieces * item.price_per_piece;

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {item.stock_name} ({item.stock_code})
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.length} - {item.pieces} pieces
                                  {item.rate_type === "per_kg" && itemWeight > 0 ? (
                                    <>
                                      <span className="mx-1">-</span>
                                      <span className="font-medium">
                                        {itemWeight}kg × {item.pieces} ={" "}
                                        {totalWeight.toFixed(2)}kg
                                      </span>
                                      <span className="mx-1">×</span>
                                      <span>₹{item.price_per_piece}/kg</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="mx-1">×</span>
                                      <span>₹{item.price_per_piece}/piece</span>
                                    </>
                                  )}
                                  <span className="mx-1">=</span>
                                  <span className="font-medium">
                                    ₹{itemTotal.toFixed(2)}
                                  </span>
                                  {!item.is_from_stock_table && (
                                    <Badge variant="secondary" className="ml-2">
                                      Manual
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeItemFromQuotation(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Additional Costs (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={costLabel}
                          onChange={(e) => setCostLabel(e.target.value)}
                          placeholder="e.g., Discount, Service Fee"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={costType}
                          onValueChange={(value: "add" | "discount") =>
                            setCostType(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costAmount || ""}
                          onChange={(e) =>
                            setCostAmount(Number(e.target.value))
                          }
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={addAdditionalCost}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Cost
                        </Button>
                      </div>
                    </div>

                    {additionalCosts.length > 0 && (
                      <div className="space-y-2">
                        {additionalCosts.map((cost, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{cost.label}</span>
                              <Badge
                                variant={
                                  cost.type === "add"
                                    ? "default"
                                    : "destructive"
                                }
                                className="ml-2"
                              >
                                {cost.type === "add" ? "+" : "-"}₹
                                {cost.amount.toFixed(2)}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeAdditionalCost(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* GST Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      GST Settings (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gst-enabled"
                        checked={gstEnabled}
                        onCheckedChange={setGstEnabled}
                      />
                      <Label htmlFor="gst-enabled">Apply GST</Label>
                    </div>

                    {gstEnabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>GST Type</Label>
                          <Select
                            value={gstType}
                            onValueChange={(
                              value: "CGST_SGST" | "IGST" | "UTGST"
                            ) => setGstType(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CGST_SGST">
                                CGST + SGST (Same State)
                              </SelectItem>
                              <SelectItem value="IGST">
                                IGST (Interstate)
                              </SelectItem>
                              <SelectItem value="UTGST">
                                UTGST (Union Territory)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>GST Percentage (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={gstPercentage}
                            onChange={(e) =>
                              setGstPercentage(Number(e.target.value))
                            }
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Print Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Print Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-unit-price"
                        checked={showUnitPrice}
                        onCheckedChange={setShowUnitPrice}
                      />
                      <Label htmlFor="show-unit-price">
                        Show unit prices in print
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                {quotationItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Calculator className="h-5 w-5 mr-2" />
                        Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        {totals.additionalTotal !== 0 && (
                          <div className="flex justify-between">
                            <span>Additional Costs:</span>
                            <span>
                              {totals.additionalTotal > 0 ? "+" : ""}₹
                              {totals.additionalTotal.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {gstEnabled && (
                          <div className="flex justify-between">
                            <span>GST ({gstPercentage}%):</span>
                            <span>₹{totals.gstAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {totals.roundingAdjustment !== 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>
                              Rounding{" "}
                              {totals.roundingAdjustment > 0 ? "Up" : "Down"}:
                            </span>
                            <span>
                              ₹{Math.abs(totals.roundingAdjustment).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>₹{totals.finalTotal.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          (Pre-rounded: ₹{totals.rawFinalTotal.toFixed(2)})
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateQuotation}
                    disabled={
                      isCreatingQuotation ||
                      !customerInput.trim() ||
                      quotationItems.length === 0
                    }
                  >
                    {isCreatingQuotation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Create Quotation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by customer name or quotation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      {showQuotationsList && (
        <Card>
          <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Quotations List ({filteredQuotations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No quotations match your search."
                  : "No quotations found. Create your first quotation to get started."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div>
                            <h3 className="font-semibold">
                              #{quotation.quotation_number} -{" "}
                              {quotation.customer_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(
                                quotation.quotation_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-center">
                            {showFinalPriceInList && (
                              <>
                                <p className="text-lg font-bold text-green-600">
                                  ₹{quotation.total_amount.toFixed(2)}
                                </p>
                                {quotation.rounding_adjustment !== 0 && (
                                  <p className="text-xs text-gray-500">
                                    (Rounded{" "}
                                    {quotation.rounding_adjustment > 0
                                      ? "up"
                                      : "down"}{" "}
                                    from ₹{quotation.raw_total.toFixed(2)})
                                  </p>
                                )}
                              </>
                            )}
                            <p className="text-xs text-gray-500">
                              {quotation.quotation_items?.length || 0} items
                            </p>
                          </div>
                          {quotation.gst_enabled && (
                            <Badge variant="outline">
                              GST {quotation.gst_percentage}%
                            </Badge>
                          )}
                        </div>

                        {/* Item Details */}
                        {quotation.quotation_items &&
                          quotation.quotation_items.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Items:
                              </h4>
                              <div className="space-y-1">
                                {quotation.quotation_items.map((item, index) => {
                                  const itemWeight = item.weight || 0;
                                  const totalWeight = itemWeight * item.pieces;
                                  const itemTotal = itemWeight
                                    ? totalWeight * item.price_per_piece
                                    : item.pieces * item.price_per_piece;

                                  return (
                                    <div
                                      key={index}
                                      className="text-sm text-gray-600 flex justify-between"
                                    >
                                      <span>
                                        {item.stock_name} ({item.stock_code})
                                        {itemWeight > 0 && (
                                          <>
                                            {" "}
                                            - {itemWeight}kg × {item.pieces} ={" "}
                                            {totalWeight.toFixed(2)}kg
                                          </>
                                        )}
                                        {!itemWeight && (
                                          <> - {item.pieces} pieces</>
                                        )}
                                      </span>
                                      {showPricesInList && (
                                        <span className="font-medium">
                                          {itemWeight > 0 ? (
                                            <>
                                              ₹{item.price_per_piece}/kg ×{" "}
                                              {totalWeight.toFixed(2)}kg
                                            </>
                                          ) : (
                                            <>
                                              ₹{item.price_per_piece}/pc ×{" "}
                                              {item.pieces}
                                            </>
                                          )}
                                          {" = "}₹{itemTotal.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Total Weight */}
                              {quotation.quotation_items.some(
                                (item) => item.weight
                              ) && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-sm font-medium text-blue-700">
                                      Total Weight:{" "}
                                      {quotation.quotation_items
                                        .reduce((sum, item) => {
                                          const netWeight =
                                            (item.weight || 0) * item.pieces;
                                          return sum + netWeight;
                                        }, 0)
                                        .toFixed(2)}
                                      kg
                                    </div>
                                  </div>
                                )}

                              {/* Additional Costs and Totals */}
                              {showPricesInList && (
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                  <div className="text-sm text-gray-600 flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">
                                      ₹{quotation.subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                  {quotation.quotation_additional_costs?.map(
                                    (cost, index) => (
                                      <div
                                        key={index}
                                        className="text-sm text-gray-600 flex justify-between"
                                      >
                                        <span>{cost.label}:</span>
                                        <span
                                          className={
                                            cost.type === "add"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          {cost.type === "add" ? "+" : "-"}₹
                                          {cost.amount.toFixed(2)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                  {quotation.gst_enabled && (
                                    <div className="text-sm text-gray-600 flex justify-between">
                                      <span>
                                        GST ({quotation.gst_percentage}%):
                                      </span>
                                      <span>
                                        ₹{quotation.gst_amount.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {quotation.rounding_adjustment !== 0 && (
                                    <div className="text-sm text-gray-600 flex justify-between">
                                      <span>
                                        Rounding{" "}
                                        {quotation.rounding_adjustment > 0
                                          ? "Up"
                                          : "Down"}
                                        :
                                      </span>
                                      <span>
                                        ₹
                                        {Math.abs(
                                          quotation.rounding_adjustment
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-sm font-bold flex justify-between border-t border-gray-300 pt-1">
                                    <span>Total:</span>
                                    <span>
                                      ₹{quotation.total_amount.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 text-right">
                                    (Pre-rounded: ₹
                                    {quotation.raw_total.toFixed(2)})
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQuotationToPrint(quotation);
                            setPrintDialogOpen(true);
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuotation(quotation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="edit-customer-input">Customer Name</Label>
                    <Input
                      id="edit-customer-input"
                      value={customerInput}
                      onChange={(e) =>
                        handleCustomerInputChange(e.target.value)
                      }
                      onKeyDown={handleCustomerKeyDown}
                      onFocus={() => setShowCustomerSuggestions(true)}
                      placeholder="Enter customer name"
                      autoComplete="off"
                    />
                    {showCustomerSuggestions &&
                      customerInput &&
                      filteredCustomers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredCustomers
                            .slice(0, 5)
                            .map((customer, index) => (
                              <div
                                key={customer.id}
                                data-customer-index={index}
                                className={cn(
                                  "p-2 cursor-pointer",
                                  index === selectedCustomerIndex
                                    ? "bg-blue-100"
                                    : "hover:bg-gray-100"
                                )}
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                {customer.name}
                              </div>
                            ))}
                        </div>
                      )}
                    {customerInput && !selectedCustomer && (
                      <p className="text-sm text-blue-600 mt-1">
                        New customer "{customerInput}" will be created
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-quotation-date">Date</Label>
                    <Input
                      id="edit-quotation-date"
                      type="date"
                      value={quotationDate}
                      onChange={(e) => setQuotationDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-customer-address">
                      Customer Address
                    </Label>
                    <Input
                      id="edit-customer-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter customer address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-customer-gstin">Customer GSTIN</Label>
                    <Input
                      id="edit-customer-gstin"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value)}
                      placeholder="Enter customer GSTIN"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-manual-item"
                    checked={isManualItem}
                    onCheckedChange={setIsManualItem}
                  />
                  <Label htmlFor="edit-manual-item">
                    Add manual item (not from stock)
                  </Label>
                </div>

                {isManualItem ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Stock Name</Label>
                      <Input
                        value={manualStockName}
                        onChange={(e) => setManualStockName(e.target.value)}
                        placeholder="Enter stock name"
                        onKeyDown={(e) =>
                          handleItemKeyDown(e, "manual-stock-name")
                        }
                      />
                    </div>
                    <div>
                      <Label>Stock Code</Label>
                      <Input
                        value={manualStockCode}
                        onChange={(e) => setManualStockCode(e.target.value)}
                        placeholder="Enter stock code"
                        onKeyDown={(e) =>
                          handleItemKeyDown(e, "manual-stock-code")
                        }
                      />
                    </div>
                    <div>
                      <Label>Length</Label>
                      <Select
                        value={manualLength}
                        onValueChange={(value: stockLength) =>
                          setManualLength(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicLengthOptions.map((len) => (
                            <SelectItem key={len} value={len}>
                              {len}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-36">
                        <Label htmlFor="edit-stock-length-filter-q">Length</Label>
                        <Select
                          value={stockLengthFilter}
                          onValueChange={(v) => {
                            setStockLengthFilter(v);
                            setSelectedStock(null);
                            setShowStockSuggestions(true);
                          }}
                        >
                          <SelectTrigger id="edit-stock-length-filter-q">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All lengths</SelectItem>
                            {dynamicLengthOptions.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative flex-1">
                        <Label>Search Stock</Label>
                        <Input
                          value={stockSearch}
                          onChange={(e) => {
                            setStockSearch(e.target.value);
                            setShowStockSuggestions(true);
                          }}
                          placeholder="Search by name or code..."
                          onKeyDown={(e) => handleItemKeyDown(e, "stock-search")}
                        />
                      </div>
                    </div>
                    {showStockSuggestions &&
                      filteredStocks.length > 0 &&
                      stockSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredStocks.slice(0, 10).map((stock, index) => (
                            <div
                              key={stock.id}
                              data-stock-index={index}
                              className={cn(
                                "px-4 py-2 cursor-pointer hover:bg-gray-50",
                                index === selectedStockIndex && "bg-blue-50"
                              )}
                              onClick={() => handleStockSelect(stock)}
                            >
                              <div className="font-medium">{stock.name}</div>
                              <div className="text-sm text-gray-500">
                                {stock.code} - {stock.length} - Qty:{" "}
                                {stock.quantity}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Pieces</Label>
                    <Input
                      type="number"
                      value={pieces || ""}
                      onChange={(e) => setPieces(Number(e.target.value))}
                      placeholder="0"
                      min="1"
                      id="pieces-input"
                      onKeyDown={(e) => handleItemKeyDown(e, "pieces")}
                    />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={itemWeight || ""}
                      onChange={(e) =>
                        setItemWeight(Number(e.target.value) || undefined)
                      }
                      placeholder={
                        selectedStock?.weight
                          ? `${selectedStock.weight} (from stock)`
                          : "Enter weight (will update stock)"
                      }
                      min="0"
                      disabled={
                        selectedStock?.weight !== undefined &&
                        selectedStock?.weight !== 0 &&
                        selectedStock?.weight !== null &&
                        !isManualItem
                      }
                    />
                    {selectedStock &&
                      !selectedStock.weight &&
                      !isManualItem && (
                        <p className="text-xs text-blue-600 mt-1">
                          Weight will be saved to stock item
                        </p>
                      )}
                  </div>
                  <div>
                    <Label>Price per Piece (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pricePerPiece || ""}
                      onChange={(e) => setPricePerPiece(Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      id="price-input"
                      onKeyDown={(e) => handleItemKeyDown(e, "price")}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addItemToQuotation} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Added Items */}
            {quotationItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Added Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quotationItems.map((item, index) => {
                      const itemWeight = item.weight || 0;
                      const totalWeight = itemWeight * item.pieces;
                      const itemTotal = itemWeight
                        ? totalWeight * item.price_per_piece
                        : item.pieces * item.price_per_piece;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.stock_name} ({item.stock_code})
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.length} - {item.pieces} pieces
                              {itemWeight > 0 && (
                                <>
                                  <span className="mx-1">-</span>
                                  <span className="font-medium">
                                    {itemWeight}kg × {item.pieces} ={" "}
                                    {totalWeight.toFixed(2)}kg
                                  </span>
                                  <span className="mx-1">×</span>
                                  <span>₹{item.price_per_piece}/kg</span>
                                </>
                              )}
                              {!itemWeight && (
                                <>
                                  <span className="mx-1">×</span>
                                  <span>₹{item.price_per_piece}/piece</span>
                                </>
                              )}
                              <span className="mx-1">=</span>
                              <span className="font-medium">
                                ₹{itemTotal.toFixed(2)}
                              </span>
                              {!item.is_from_stock_table && (
                                <Badge variant="secondary" className="ml-2">
                                  Manual
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItemFromQuotation(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Additional Costs (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={costLabel}
                      onChange={(e) => setCostLabel(e.target.value)}
                      placeholder="e.g., Discount, Service Fee"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={costType}
                      onValueChange={(value: "add" | "discount") =>
                        setCostType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={costAmount || ""}
                      onChange={(e) => setCostAmount(Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addAdditionalCost}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cost
                    </Button>
                  </div>
                </div>

                {additionalCosts.length > 0 && (
                  <div className="space-y-2">
                    {additionalCosts.map((cost, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{cost.label}</span>
                          <Badge
                            variant={
                              cost.type === "add" ? "default" : "destructive"
                            }
                            className="ml-2"
                          >
                            {cost.type === "add" ? "+" : "-"}₹
                            {cost.amount.toFixed(2)}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAdditionalCost(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GST Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  GST Settings (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-gst-enabled"
                    checked={gstEnabled}
                    onCheckedChange={setGstEnabled}
                  />
                  <Label htmlFor="edit-gst-enabled">Apply GST</Label>
                </div>

                {gstEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>GST Type</Label>
                      <Select
                        value={gstType}
                        onValueChange={(
                          value: "CGST_SGST" | "IGST" | "UTGST"
                        ) => setGstType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CGST_SGST">
                            CGST + SGST (Same State)
                          </SelectItem>
                          <SelectItem value="IGST">
                            IGST (Interstate)
                          </SelectItem>
                          <SelectItem value="UTGST">
                            UTGST (Union Territory)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>GST Percentage (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={gstPercentage}
                        onChange={(e) =>
                          setGstPercentage(Number(e.target.value))
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Print Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Print Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-show-unit-price"
                    checked={showUnitPrice}
                    onCheckedChange={setShowUnitPrice}
                  />
                  <Label htmlFor="edit-show-unit-price">
                    Show unit prices in print
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {quotationItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.additionalTotal !== 0 && (
                      <div className="flex justify-between">
                        <span>Additional Costs:</span>
                        <span>
                          {totals.additionalTotal > 0 ? "+" : ""}₹
                          {totals.additionalTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {gstEnabled && (
                      <div className="flex justify-between">
                        <span>GST ({gstPercentage}%):</span>
                        <span>₹{totals.gstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.roundingAdjustment !== 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          Rounding{" "}
                          {totals.roundingAdjustment > 0 ? "Up" : "Down"}:
                        </span>
                        <span>
                          ₹{Math.abs(totals.roundingAdjustment).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{totals.finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      (Pre-rounded: ₹{totals.rawFinalTotal.toFixed(2)})
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                  setEditingQuotation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuotation}
                disabled={
                  isCreatingQuotation ||
                  !customerInput ||
                  quotationItems.length === 0
                }
              >
                {isCreatingQuotation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Update Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Print Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              How would you like to print quotation #
              {quotationToPrint?.quotation_number}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPrintDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (quotationToPrint) {
                    handlePrintQuotation(quotationToPrint, false);
                  }
                  setPrintDialogOpen(false);
                }}
                className="flex-1"
              >
                Without Prices
              </Button>
              <Button
                onClick={() => {
                  if (quotationToPrint) {
                    handlePrintQuotation(quotationToPrint, true);
                  }
                  setPrintDialogOpen(false);
                }}
                className="flex-1"
              >
                With Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Quotation Created Successfully!"
        message={`Quotation for ${createdQuotation?.customer_name || ""} has been created.`}
        onPrint={handleSuccessDialogPrint}
        showPrintOption={true}
        printLabel="Print Quotation"
      />
    </div>
  );
};

export default QuotationManager;
