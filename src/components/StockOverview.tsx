import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Search,
  Filter,
  History,
  Loader2,
  Printer,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  id: string;
  name: string;
  code: string;
  length: "16ft" | "12ft";
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface StockHistory {
  id: string;
  type: "ADD" | "SELL" | "ADJUST";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
}

interface StockOverviewProps {
  stocks: Stock[];
  showLowStockOnly: boolean;
  onFilterChange?: (showLowOnly: boolean) => void;
  onStockCreate: (stockData: {
    name: string;
    code: string;
    length: "16ft" | "12ft";
    quantity: number;
  }) => Promise<any>;
  onStockDelete: (stockId: string) => Promise<any>;
  onRefresh: () => Promise<void>;
}

const StockOverview = ({
  stocks,
  showLowStockOnly,
  onFilterChange,
  onStockCreate,
  onStockDelete,
  onRefresh,
}: StockOverviewProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  // Form states
  const [codeInput, setCodeInput] = useState("");
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
  const [selectedCodeIndex, setSelectedCodeIndex] = useState(-1);
  const [existingStock, setExistingStock] = useState<Stock | null>(null);

  const [newStock, setNewStock] = useState({
    name: "",
    code: "",
    length: "16ft" as "16ft" | "12ft",
    quantity: 0,
  });

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStockOnly || stock.quantity < 50;
    return matchesSearch && matchesLowStock;
  });

  // Filter stocks based on code input for suggestions
  const codeSuggestions = stocks
    .filter(
      (stock) =>
        stock.code.toLowerCase().includes(codeInput.toLowerCase()) &&
        codeInput.trim() !== ""
    )
    .slice(0, 5);

  // Handle code input changes
  const handleCodeInputChange = (value: string) => {
    setCodeInput(value);
    setNewStock((prev) => ({ ...prev, code: value }));
    setShowCodeSuggestions(true);
    setSelectedCodeIndex(-1);

    // Check if code matches existing stock
    const matchingStock = stocks.find(
      (stock) => stock.code.toLowerCase() === value.toLowerCase()
    );

    if (matchingStock) {
      setExistingStock(matchingStock);
      setNewStock((prev) => ({
        ...prev,
        name: matchingStock.name,
        length: matchingStock.length,
      }));
    } else {
      setExistingStock(null);
      if (value.trim() === "") {
        setNewStock((prev) => ({ ...prev, name: "", length: "16ft" }));
      }
    }
  };

  // Handle code suggestion selection
  const handleCodeSelect = (stock: Stock) => {
    setCodeInput(stock.code);
    setNewStock((prev) => ({
      ...prev,
      code: stock.code,
      name: stock.name,
      length: stock.length,
    }));
    setExistingStock(stock);
    setShowCodeSuggestions(false);
    setSelectedCodeIndex(-1);
  };

  // Handle keyboard navigation for code suggestions
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (!showCodeSuggestions || codeSuggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        // Move to next field
        const nameInput = document.getElementById("stock-name");
        if (nameInput) nameInput.focus();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedCodeIndex((prev) =>
          prev < codeSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedCodeIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedCodeIndex >= 0) {
          handleCodeSelect(codeSuggestions[selectedCodeIndex]);
        } else if (codeSuggestions.length > 0) {
          handleCodeSelect(codeSuggestions[0]);
        }
        break;
      case "Escape":
        setShowCodeSuggestions(false);
        setSelectedCodeIndex(-1);
        break;
    }
  };

  const resetForm = () => {
    setCodeInput("");
    setNewStock({ name: "", code: "", length: "16ft", quantity: 0 });
    setExistingStock(null);
    setShowCodeSuggestions(false);
    setSelectedCodeIndex(-1);
  };

  const handleAddStock = async () => {
    if (
      !newStock.name.trim() ||
      !newStock.code.trim() ||
      newStock.quantity <= 0
    ) {
      alert("Please fill all fields");
      return;
    }

    setIsAddingStock(true);
    try {
      await onStockCreate(newStock);
      resetForm();
      setIsAddDialogOpen(false);
      alert("Stock added successfully!");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock. Please try again.");
    } finally {
      setIsAddingStock(false);
    }
  };

  const fetchStockHistory = async (stockId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("stock_history")
        .select("*")
        .eq("stock_id", stockId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStockHistory(data || []);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      alert("Failed to load stock history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistory = (stock: Stock) => {
    setSelectedStock(stock);
    setIsHistoryDialogOpen(true);
    fetchStockHistory(stock.id);
  };

  const handleEditStock = (stock: Stock) => {
    setEditingStock(stock);
    setNewStock({
      name: stock.name,
      code: stock.code,
      length: stock.length,
      quantity: stock.quantity,
    });
    setCodeInput(stock.code);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (
      !editingStock ||
      !newStock.name.trim() ||
      !newStock.code.trim() ||
      newStock.quantity < 0
    ) {
      alert("Please fill all fields correctly");
      return;
    }

    setIsAddingStock(true);
    try {
      const { data, error } = await supabase
        .from("stocks")
        .update({
          name: newStock.name,
          code: newStock.code,
          length: newStock.length,
          quantity: newStock.quantity,
        })
        .eq("id", editingStock.id)
        .select()
        .single();

      if (error) throw error;

      // Refresh stocks
      await onRefresh();
      resetForm();
      setIsEditDialogOpen(false);
      setEditingStock(null);
      alert("Stock updated successfully!");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock. Please try again.");
    } finally {
      setIsAddingStock(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ADD":
        return "bg-green-100 text-green-800";
      case "SELL":
        return "bg-red-100 text-red-800";
      case "ADJUST":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteStock = async (stockId: string, stockName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${stockName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await onStockDelete(stockId);
      alert("Stock deleted successfully!");
    } catch (error) {
      console.error("Error deleting stock:", error);
      alert("Failed to delete stock. Please try again.");
    }
  };

  const handlePrintAllStocks = () => {
    const sortedStocks = [...stocks].sort((a, b) =>
      a.code.localeCompare(b.code)
    );

    const lowStockCount = sortedStocks.filter(
      (stock) => stock.quantity < 50
    ).length;
    const totalQuantity = sortedStocks.reduce(
      (total, stock) => total + stock.quantity,
      0
    );

    const printContent = `
      <div style="padding: 8px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: bold;">STOCK INVENTORY</h1>
        </div>
        
        <div style="margin-bottom: 8px; padding: 6px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 1px 0; font-weight: bold; width: 25%;">Date:</td>
              <td style="padding: 1px 0; width: 25%;">${new Date().toLocaleDateString()}</td>
              <td style="padding: 1px 0; font-weight: bold; width: 25%;">Time:</td>
              <td style="padding: 1px 0; width: 25%;">${new Date().toLocaleTimeString()}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0; font-weight: bold;">Items:</td>
              <td style="padding: 1px 0;">${sortedStocks.length}</td>
              <td style="padding: 1px 0; font-weight: bold;">Low Stock:</td>
              <td style="padding: 1px 0; color: ${
                lowStockCount > 0 ? "red" : "green"
              }; font-weight: bold;">${lowStockCount}</td>
            </tr>
            <tr>
              <td style="padding: 1px 0; font-weight: bold;">Total Qty:</td>
              <td style="padding: 1px 0; font-weight: bold;">${totalQuantity}</td>
              <td colspan="2"></td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 8px;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: bold; font-size: 9px;">Code</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: bold; font-size: 9px;">Item</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Len</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Qty</th>
                <th style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedStocks
                .map(
                  (stock) => `
                <tr ${
                  stock.quantity < 50
                    ? 'style="background-color: #ffebee;"'
                    : ""
                }>
                  <td style="border: 1px solid #000; padding: 3px; font-weight: bold; font-size: 9px;">${
                    stock.code
                  }</td>
                  <td style="border: 1px solid #000; padding: 3px; font-size: 9px;">${
                    stock.name
                  }</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${
                    stock.length
                  }</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 9px; ${
                    stock.quantity < 50 ? "color: red;" : "color: green;"
                  }">${stock.quantity}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 8px; ${
                    stock.quantity < 50 ? "color: red;" : "color: green;"
                  }">
                    ${stock.quantity < 50 ? "LOW" : "OK"}
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0;">
                <td colspan="3" style="border: 1px solid #000; padding: 3px; font-weight: bold; text-align: right; font-size: 9px;">Total:</td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 10px;">
                  ${totalQuantity}
                </td>
                <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-size: 8px; color: ${
                  lowStockCount > 0 ? "red" : "green"
                };">
                  ${lowStockCount > 0 ? `${lowStockCount} LOW` : "ALL OK"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 10px; text-align: center; font-size: 8px; color: #666;">
          Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
      </div>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Stock Inventory Report - ${new Date().toLocaleDateString()}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { size: B5; margin: 10mm; }
              }
              body { font-family: Arial, sans-serif; }
              table { page-break-inside: avoid; }
              .low-stock { background-color: #ffebee !important; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* <h2 className="text-xl lg:text-2xl font-bold">Stock Overview</h2> */}
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* Filter Toggle */}
          {onFilterChange && (
            <div className="flex items-center space-x-2">
              <Switch
                id="low-stock-filter"
                checked={showLowStockOnly}
                onCheckedChange={onFilterChange}
              />
              <Label htmlFor="low-stock-filter" className="text-sm">
                Show Low Stock Only
              </Label>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handlePrintAllStocks}
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print All</span>
          </Button>

          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Stock</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">
                  Add New Stock
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddStock();
                }}
                className="space-y-4"
              >
                {/* Stock Code - First Field */}
                <div className="relative">
                  <Label htmlFor="stock-code">Stock Code</Label>
                  <Input
                    id="stock-code"
                    value={codeInput}
                    onChange={(e) => handleCodeInputChange(e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    onFocus={() => setShowCodeSuggestions(true)}
                    placeholder="SR001"
                    autoComplete="off"
                    className="w-full"
                  />
                  {showCodeSuggestions &&
                    codeInput &&
                    codeSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {codeSuggestions.map((stock, index) => (
                          <div
                            key={stock.id}
                            className={`p-2 cursor-pointer ${
                              index === selectedCodeIndex
                                ? "bg-blue-100"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => handleCodeSelect(stock)}
                          >
                            <div className="font-medium">{stock.code}</div>
                            <div className="text-sm text-gray-600">
                              {stock.name} - {stock.length} - {stock.quantity}{" "}
                              available
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  {codeInput && !existingStock && (
                    <p className="text-sm text-blue-600 mt-1">
                      New stock code "{codeInput}" will be created
                    </p>
                  )}
                  {existingStock && (
                    <p className="text-sm text-green-600 mt-1">
                      Adding quantity to existing stock: {existingStock.name}
                    </p>
                  )}
                </div>

                {/* Stock Name - Auto-filled if code exists */}
                <div>
                  <Label htmlFor="stock-name">Stock Name</Label>
                  <Input
                    id="stock-name"
                    value={newStock.name}
                    onChange={(e) =>
                      setNewStock((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Steel Rebar"
                    disabled={!!existingStock}
                    autoComplete="off"
                    className={existingStock ? "bg-gray-100" : ""}
                  />
                </div>

                {/* Stock Length */}
                <div>
                  <Label htmlFor="stock-length">Stock Length</Label>
                  <select
                    id="stock-length"
                    title="Select stock length"
                    className={`w-full border rounded-md py-2 px-3 ${
                      existingStock ? "bg-gray-100" : ""
                    }`}
                    value={newStock.length}
                    onChange={(e) =>
                      setNewStock((prev) => ({
                        ...prev,
                        length: e.target.value as "16ft" | "12ft",
                      }))
                    }
                    disabled={!!existingStock}
                  >
                    <option value="16ft">16ft</option>
                    <option value="12ft">12ft</option>
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <Label htmlFor="stock-quantity">
                    {existingStock ? "Quantity to Add" : "Stock Quantity"}
                  </Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    value={newStock.quantity === 0 ? "" : newStock.quantity}
                    onChange={(e) =>
                      setNewStock((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="100"
                    autoComplete="off"
                    min="1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isAddingStock}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStock}
                    disabled={isAddingStock}
                    className="flex-1"
                  >
                    {isAddingStock ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {existingStock ? "Adding..." : "Creating..."}
                      </>
                    ) : existingStock ? (
                      "Add Quantity"
                    ) : (
                      "Create Stock"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Stock Dialog */}
          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                resetForm();
                setEditingStock(null);
              }
            }}
          >
            <DialogContent className="w-[95vw] max-w-md p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">
                  Edit Stock
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateStock();
                }}
                className="space-y-4"
              >
                {/* Stock Code */}
                <div>
                  <Label htmlFor="edit-stock-code">Stock Code</Label>
                  <Input
                    id="edit-stock-code"
                    value={newStock.code}
                    onChange={(e) =>
                      setNewStock((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="SR001"
                    autoComplete="off"
                    className="w-full"
                  />
                </div>

                {/* Stock Name */}
                <div>
                  <Label htmlFor="edit-stock-name">Stock Name</Label>
                  <Input
                    id="edit-stock-name"
                    value={newStock.name}
                    onChange={(e) =>
                      setNewStock((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Steel Rebar"
                    autoComplete="off"
                  />
                </div>

                {/* Stock Length */}
                <div>
                  <Label htmlFor="edit-stock-length">Stock Length</Label>
                  <select
                    id="edit-stock-length"
                    title="Select stock length"
                    className="w-full border rounded-md py-2 px-3"
                    value={newStock.length}
                    onChange={(e) =>
                      setNewStock((prev) => ({
                        ...prev,
                        length: e.target.value as "16ft" | "12ft",
                      }))
                    }
                  >
                    <option value="16ft">16ft</option>
                    <option value="12ft">12ft</option>
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <Label htmlFor="edit-stock-quantity">Stock Quantity</Label>
                  <Input
                    id="edit-stock-quantity"
                    type="number"
                    value={newStock.quantity === 0 ? "" : newStock.quantity}
                    onChange={(e) =>
                      setNewStock((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="100"
                    autoComplete="off"
                    min="0"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isAddingStock}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStock}
                    disabled={isAddingStock}
                    className="flex-1"
                  >
                    {isAddingStock ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Stock"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock Grid */}
      <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStocks.map((stock) => (
          <Card
            key={stock.id}
            className={stock.quantity < 50 ? "border-red-200 bg-red-50" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {stock.quantity < 50 && (
                    <Badge variant="destructive" className="text-xs">
                      Low Stock
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStock(stock)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewHistory(stock)}
                    className="h-8 w-8 p-0"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStock(stock.id, stock.name)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm lg:text-base">
                  {stock.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-gray-600">
                    {stock.code}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {stock.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs lg:text-sm text-gray-600">
                    Quantity:
                  </span>
                  <span
                    className={`font-bold text-sm lg:text-base ${
                      stock.quantity < 50 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {stock.quantity}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Updated: {new Date(stock.updated_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStocks.length === 0 && (
        <div className="text-center py-8 text-gray-500">No stocks found</div>
      )}

      {/* Stock History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              Stock History - {selectedStock?.name} ({selectedStock?.code})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading history...</span>
              </div>
            ) : stockHistory.length > 0 ? (
              <div className="space-y-3">
                {stockHistory.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getTypeColor(entry.type)}>
                        {entry.type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Change:</span>
                        <span
                          className={`ml-1 font-medium ${
                            entry.quantity_change > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.quantity_change > 0 ? "+" : ""}
                          {entry.quantity_change}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Before:</span>
                        <span className="ml-1 font-medium">
                          {entry.quantity_before}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">After:</span>
                        <span className="ml-1 font-medium">
                          {entry.quantity_after}
                        </span>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {entry.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No history found for this stock item
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockOverview;
