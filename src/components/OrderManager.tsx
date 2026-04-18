import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Printer,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  CheckSquare,
  Square,
  DollarSign,
  Percent,
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
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Stock, Customer, Order, OrderItem, OrderAdditionalCost } from "@/hooks/useStockData";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { cn } from "@/lib/utils";

interface OrderManagerProps {
  stocks: Stock[];
  customers: Customer[];
  orders: Order[];
  onOrderCreate: (
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string,
    vehicleNumber?: string,
    agentName?: string,
    gstEnabled?: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage?: number,
    showUnitPrice?: boolean,
    additionalCosts?: Omit<OrderAdditionalCost, "id" | "order_id">[],
    customerAddress?: string,
    customerGstin?: string,
    orderDate?: string,
    siteName?: string
  ) => Promise<Order>;
  onOrderUpdate: (
    orderId: string,
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string,
    vehicleNumber?: string,
    agentName?: string,
    gstEnabled?: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage?: number,
    showUnitPrice?: boolean,
    additionalCosts?: Omit<OrderAdditionalCost, "id" | "order_id">[],
    customerAddress?: string,
    customerGstin?: string,
    siteName?: string
  ) => Promise<Order>;
  onOrderDelete: (orderId: string) => Promise<void>;
  onOrderHide: (orderId: string) => Promise<void>;
  onOrderShow: (orderId: string) => Promise<void>;
  onCustomerCreate: (name: string, mobileNumber?: string) => Promise<Customer>;
  fetchCustomers: () => Promise<void>;
  fetchOrders: (
    includeHidden?: boolean,
    showTodayOnly?: boolean
  ) => Promise<void>;
  filterCustomer: string;
  setFilterCustomer: (filterCustomer: string) => void;
}

interface OrderItemForm {
  stock_id: string;
  pieces_used: number;
  price_per_piece: number;
  weight?: number;
  stock_name: string;
  stock_code: string;
  stock_length: string;
  is_from_stock_table?: boolean;
  rate_type?: "per_pc" | "per_kg";
}

const OrderManager = ({
  stocks,
  customers,
  orders,
  onOrderCreate,
  onOrderUpdate,
  onOrderDelete,
  onOrderHide,
  onOrderShow,
  onCustomerCreate,
  fetchCustomers,
  fetchOrders,
  filterCustomer,
  setFilterCustomer,
}: OrderManagerProps) => {
  const { companySettings } = useCompanySettings();

  const dynamicLengthOptions = Array.from(new Set(stocks.map(s => s.length).filter(Boolean))).sort();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [originalOrderItems, setOriginalOrderItems] = useState<OrderItemForm[]>(
    []
  );
  const [showHiddenOrders, setShowHiddenOrders] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // Form states
  const [customerInput, setCustomerInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [colorCode, setColorCode] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);

  // Current item being added
  const [stockSearch, setStockSearch] = useState("");
  const [stockLengthFilter, setStockLengthFilter] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [pieces, setPieces] = useState(0);
  const [stockError, setStockError] = useState("");
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [selectedStockIndex, setSelectedStockIndex] = useState(-1);

  // Filter states
  const [mobileNumber, setMobileNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [agentName, setAgentName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [pricePerPiece, setPricePerPiece] = useState<number | "">("");
  const [rateType, setRateType] = useState<"per_pc" | "per_kg">("per_kg");
  const [itemWeight, setItemWeight] = useState<number | undefined>(undefined);
  const [manualNetWeight, setManualNetWeight] = useState<number | "">("");

  // GST States
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstType, setGstType] = useState<"CGST_SGST" | "IGST" | "UTGST">("CGST_SGST");
  const [gstPercentage, setGstPercentage] = useState(18);
  const [showUnitPrice, setShowUnitPrice] = useState(true);

  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState<Omit<OrderAdditionalCost, "id" | "order_id">[]>([]);

  // Inline validation errors
  const [customerNameError, setCustomerNameError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [gstinError, setGstinError] = useState("");

  //   const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // New cost form states
  const [newCostLabel, setNewCostLabel] = useState("");
  const [newCostType, setNewCostType] = useState<"add" | "discount">("add");
  const [newCostAmount, setNewCostAmount] = useState<number | "">("");

  const addAdditionalCost = () => {
    if (!newCostLabel || newCostAmount === "") return;
    setAdditionalCosts((prev) => [
      ...prev,
      { label: newCostLabel, type: newCostType, amount: Number(newCostAmount) },
    ]);
    setNewCostLabel("");
    setNewCostAmount("");
  };

  const removeAdditionalCost = (index: number) => {
    setAdditionalCosts((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      (stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        stock.code.toLowerCase().includes(stockSearch.toLowerCase())) &&
      (stockLengthFilter === "all" || stock.length === stockLengthFilter)
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerInput.toLowerCase())
  );

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const filteredOrders = orders.filter((order) => {
    const matchesCustomer =
      !filterCustomer ||
      order.customer_id === filterCustomer ||
      filterCustomer === "all";
    const matchesDateFrom =
      !filterDateFrom || order.order_date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || order.order_date <= filterDateTo;
    const matchesToday = !showTodayOnly || order.order_date === getTodayDate();

    return matchesCustomer && matchesDateFrom && matchesDateTo && matchesToday;
  });

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
    setSelectedCustomer(customer);
    setShowCustomerSuggestions(false);
    setSelectedCustomerIndex(-1);
    setCustomerNameError("");
    // Pre-fill mobile and address from the customer record if they exist
    if (customer.mobile_number) setMobileNumber(customer.mobile_number);
    if (customer.address) setCustomerAddress(customer.address);
    if (customer.gstin_number) setCustomerGstin(customer.gstin_number);
  };

  // Handle keyboard navigation for customer suggestions
  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!showCustomerSuggestions || filteredCustomers.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        // Move to next field (color code)
        const colorCodeInput = document.getElementById("color-code");
        if (colorCodeInput) colorCodeInput.focus();
      }
      return;
    }

    const visibleCustomerCount = Math.min(filteredCustomers.length, 5);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedCustomerIndex((prev) => {
          const newIndex = prev < visibleCustomerCount - 1 ? prev + 1 : prev;
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
        } else if (visibleCustomerCount > 0) {
          handleCustomerSelect(filteredCustomers[0]);
        }
        setTimeout(() => {
          const colorCodeInput = document.getElementById("color-code");
          if (colorCodeInput) colorCodeInput.focus();
        }, 100);
        break;
      case "Escape":
        setShowCustomerSuggestions(false);
        setSelectedCustomerIndex(-1);
        break;
    }
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setStockSearch(`${stock.name} (${stock.code})`);
    setStockError("");
    setShowStockSuggestions(false);
    setSelectedStockIndex(-1);
    const weight = stock.weight || undefined;
    setItemWeight(weight);
    if (pieces > 0 && weight) {
      setManualNetWeight(Number((weight * pieces).toFixed(3)));
    } else {
      setManualNetWeight("");
    }
  };

  // Handle keyboard navigation for stock suggestions
  const handleStockKeyDown = (e: React.KeyboardEvent) => {
    if (!showStockSuggestions || filteredStocks.length === 0) return;

    const visibleStockCount = Math.min(filteredStocks.length, 5);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedStockIndex((prev) => {
          const newIndex = prev < visibleStockCount - 1 ? prev + 1 : prev;
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
        } else if (visibleStockCount > 0) {
          handleStockSelect(filteredStocks[0]);
        }
        break;
      case "Escape":
        setShowStockSuggestions(false);
        setSelectedStockIndex(-1);
        break;
    }
  };

  const validateStockQuantity = (
    quantity: number = pieces,
    stock: Stock | null = selectedStock
  ) => {
    if (!stock || quantity <= 0) {
      setStockError("Please select a stock item and enter valid quantity");
      return false;
    }

    if (quantity > stock.quantity) {
      setStockError(`Only ${stock.quantity} pieces available`);
      return false;
    }

    // Check if item already exists in order
    const existingItem = orderItems.find((item) => item.stock_id === stock.id);
    if (existingItem) {
      setStockError("This item is already added to the order");
      return false;
    }

    setStockError("");
    return true;
  };

  const addItemToOrder = () => {
    if (!validateStockQuantity()) return;

    const newItem: OrderItemForm = {
      stock_id: selectedStock!.id,
      pieces_used: pieces,
      price_per_piece: Number(pricePerPiece) || 0,
      weight: itemWeight,
      stock_name: selectedStock!.name,
      stock_code: selectedStock!.code,
      stock_length: selectedStock!.length,
      is_from_stock_table: true,
      rate_type: rateType,
      manual_net_weight: Number(manualNetWeight) || undefined,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setStockSearch("");
    setSelectedStock(null);
    setPieces(0);
    setPricePerPiece("");
    setItemWeight(undefined);
    setManualNetWeight("");
    setStockError("");
    setShowStockSuggestions(false);
    setSelectedStockIndex(-1);

    // Focus back on stock search
    setTimeout(() => {
      const stockSearchInput = document.getElementById("stock-search");
      if (stockSearchInput) stockSearchInput.focus();
    }, 100);
  };

  const removeItemFromOrder = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCustomerInput("");
    setSelectedCustomer(null);
    setColorCode("");
    setVehicleNumber("");
    setAgentName("");
    setSiteName("");
    setCustomerAddress("");
    setCustomerGstin("");
    setMobileNumber("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setRateType("per_kg");
    setGstEnabled(true);
    setAdditionalCosts([]);
    setOrderItems([]);
    setOriginalOrderItems([]);
    setStockSearch("");
    setStockLengthFilter("all");
    setSelectedStock(null);
    setPieces(0);
    setPricePerPiece("");
    setItemWeight(undefined);
    setStockError("");
    setShowStockSuggestions(false);
    setSelectedStockIndex(-1);
    setGstType("CGST_SGST");
    setGstPercentage(18);
    setShowUnitPrice(true);
    setNewCostLabel("");
    setNewCostAmount("");
    setNewCostType("add");
    setCustomerNameError("");
    setMobileError("");
    setGstinError("");
  };

  const handleCancelEdit = () => {
    setOrderItems(originalOrderItems);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingOrder(null);
  };

  const handleCreateOrder = async () => {
    // Inline validation — clear previous errors first
    setCustomerNameError("");
    setMobileError("");
    setGstinError("");

    let hasError = false;

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    if (!customerInput.trim()) {
      setCustomerNameError("Customer name is required.");
      hasError = true;
    }

    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      setMobileError("Enter a valid 10-digit mobile number (starts with 6–9).");
      hasError = true;
    }

    if (
      customerGstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        customerGstin.trim().toUpperCase()
      )
    ) {
      setGstinError("Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).");
      hasError = true;
    }

    if (hasError) return;

    setIsCreatingOrder(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if not existing
      if (!customerId && customerInput.trim()) {
        const newCustomer = await onCustomerCreate(customerInput.trim(), mobileNumber);
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Failed to get customer ID");
      }

      const items = orderItems.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
        price_per_piece: item.price_per_piece,
        weight: item.weight,
        stock_name: item.stock_name,
        stock_code: item.stock_code,
        stock_length: item.stock_length,
        is_from_stock_table: item.is_from_stock_table,
        rate_type: item.rate_type || "per_kg",
      }));

      const newOrder = await onOrderCreate(
        customerId,
        items,
        colorCode,
        vehicleNumber,
        agentName,
        gstEnabled,
        gstType,
        gstPercentage,
        showUnitPrice,
        additionalCosts,
        customerAddress,
        customerGstin,
        orderDate,
        siteName
      );

      // Compute totals locally so print is correct immediately (DB RPC runs async)
      const localSubtotal = orderItems.reduce(
        (sum, oi) => {
          const iw = oi.weight || 0;
          const nw = iw * oi.pieces_used;
          if (oi.rate_type === "per_kg" && nw > 0) {
            return sum + oi.price_per_piece * nw;
          }
          return sum + oi.price_per_piece * oi.pieces_used;
        },
        0
      );
      const additionalNet = additionalCosts.reduce(
        (sum, c) => (c.type === "add" ? sum + c.amount : sum - c.amount),
        0
      );
      const rawTotal = localSubtotal + additionalNet;
      const gstAmount = gstEnabled ? rawTotal * (gstPercentage / 100) : 0;
      const totalBeforeRound = rawTotal + gstAmount;
      const localTotal = Math.round(totalBeforeRound);
      const roundingAdj = localTotal - totalBeforeRound;

      // Build a complete order object with all data needed for the print receipt
      const completeOrder = {
        ...newOrder,
        customer_name: selectedCustomer?.name || customerInput,
        customer_address: customerAddress,
        customer_gstin: customerGstin,
        color_code: colorCode,
        vehicle_number: vehicleNumber,
        agent_name: agentName,
        site_name: siteName,
        gst_enabled: gstEnabled,
        gst_type: gstType,
        gst_percentage: gstPercentage,
        show_unit_price: showUnitPrice,
        order_additional_costs: additionalCosts,
        subtotal: localSubtotal,
        raw_total: rawTotal,
        gst_amount: gstAmount,
        total_amount: localTotal,
        rounding_adjustment: roundingAdj,
        order_items: orderItems.map((oi) => ({
          stock_id: oi.stock_id,
          pieces_used: oi.pieces_used,
          price_per_piece: oi.price_per_piece,
          weight: oi.weight,
          stock_name: oi.stock_name,
          stock_code: oi.stock_code,
          stock_length: oi.stock_length,
          rate_type: oi.rate_type,
        })),
        order_date: orderDate,
      };
      setCreatedOrder(completeOrder);
      resetForm();
      setIsCreateDialogOpen(false);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setCustomerInput(order.customer_name || "");
    setSelectedCustomer(
      customers.find((c) => c.id === order.customer_id) || null
    );
    setColorCode(order.color_code || "");
    setVehicleNumber(order.vehicle_number || "");
    setAgentName(order.agent_name || "");
    setSiteName(order.site_name || "");
    setOrderDate(order.order_date || new Date().toISOString().split("T")[0]);
    setGstEnabled(order.gst_enabled || false);
    setGstType(order.gst_type || "CGST_SGST");
    setGstPercentage(order.gst_percentage || 18);
    setShowUnitPrice(order.show_unit_price ?? true);

    // Attempt to get mobile number if available
    const orderCustomer = customers.find((c) => c.id === order.customer_id);
    setMobileNumber(orderCustomer?.mobile_number || "");
    setCustomerAddress(order.customer_address || "");
    setCustomerGstin(order.customer_gstin || "");
    setAdditionalCosts(order.order_additional_costs || []);

    const items =
      order.order_items?.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
        price_per_piece: item.price_per_piece || 0,
        weight: item.weight,
        stock_name: item.stock_name || "",
        stock_code: item.stock_code || "",
        stock_length: item.stock_length || "",
      })) || [];
    setOrderItems(items);
    setOriginalOrderItems(items);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    // Inline validation
    setCustomerNameError("");
    setMobileError("");
    setGstinError("");
    let hasError = false;

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    if (!customerInput.trim()) {
      setCustomerNameError("Customer name is required.");
      hasError = true;
    }

    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      setMobileError("Enter a valid 10-digit mobile number (starts with 6–9).");
      hasError = true;
    }

    if (
      customerGstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        customerGstin.trim().toUpperCase()
      )
    ) {
      setGstinError("Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).");
      hasError = true;
    }

    if (hasError) return;

    setIsCreatingOrder(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (!customerId && customerInput.trim()) {
        const newCustomer = await onCustomerCreate(customerInput.trim(), mobileNumber);
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Failed to get customer ID");
      }

      const items = orderItems.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
        price_per_piece: item.price_per_piece,
        weight: item.weight,
        stock_name: item.stock_name,
        stock_code: item.stock_code,
        stock_length: item.stock_length,
        is_from_stock_table: item.is_from_stock_table,
        rate_type: item.rate_type || "per_kg"
      }));

      await onOrderUpdate(
        editingOrder.id,
        customerId,
        items,
        colorCode,
        vehicleNumber,
        agentName,
        gstEnabled,
        gstType,
        gstPercentage,
        showUnitPrice,
        additionalCosts,
        customerAddress,
        customerGstin,
        siteName
      );
      resetForm();
      setIsEditDialogOpen(false);
      setEditingOrder(null);
      alert("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Please try again.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      await onOrderDelete(orderId);
      alert("Order deleted successfully!");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order. Please try again.");
    }
  };

  const handleHideOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to hide this order?")) return;

    try {
      await onOrderHide(orderId);
      alert("Order hidden successfully!");
    } catch (error) {
      console.error("Error hiding order:", error);
      alert("Failed to hide order. Please try again.");
    }
  };

  const handleShowOrder = async (orderId: string) => {
    try {
      await onOrderShow(orderId);
      alert("Order shown successfully!");
    } catch (error) {
      console.error("Error showing order:", error);
      alert("Failed to show order. Please try again.");
    }
  };

  const toggleHiddenOrders = async () => {
    const newShowHidden = !showHiddenOrders;
    setShowHiddenOrders(newShowHidden);
    await fetchOrders(newShowHidden, showTodayOnly);
  };

  const toggleTodayFilter = async () => {
    const newShowTodayOnly = !showTodayOnly;
    setShowTodayOnly(newShowTodayOnly);
    await fetchOrders(showHiddenOrders, newShowTodayOnly);
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((order) => order.id)));
    }
  };

  const handleBulkHide = async () => {
    if (selectedOrders.size === 0) {
      alert("Please select orders to hide");
      return;
    }

    if (
      !confirm(`Are you sure you want to hide ${selectedOrders.size} order(s)?`)
    )
      return;

    try {
      for (const orderId of selectedOrders) {
        await onOrderHide(orderId);
      }
      setSelectedOrders(new Set());
      alert(`${selectedOrders.size} order(s) hidden successfully!`);
    } catch (error) {
      console.error("Error hiding orders:", error);
      alert("Failed to hide some orders. Please try again.");
    }
  };

  const handleBulkShow = async () => {
    if (selectedOrders.size === 0) {
      alert("Please select orders to show");
      return;
    }

    try {
      for (const orderId of selectedOrders) {
        await onOrderShow(orderId);
      }
      setSelectedOrders(new Set());
      alert(`${selectedOrders.size} order(s) shown successfully!`);
    } catch (error) {
      console.error("Error showing orders:", error);
      alert("Failed to show some orders. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) {
      alert("Please select orders to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`
      )
    )
      return;

    try {
      for (const orderId of selectedOrders) {
        await onOrderDelete(orderId);
      }
      setSelectedOrders(new Set());
      alert(`${selectedOrders.size} order(s) deleted successfully!`);
    } catch (error) {
      console.error("Error deleting orders:", error);
      alert("Failed to delete some orders. Please try again.");
    }
  };

  const handlePrintOrder = (order: Order) => {
    // Attempt to find customer to get mobile number if available
    const orderCustomer = customers.find((c) => c.id === order.customer_id);
    const mobileNo = orderCustomer?.mobile_number || "";
    const showPrice = order.show_unit_price;
    const colSpan = showPrice ? 8 : 7;
    const priceHeader = showPrice
      ? `<th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:12%;font-weight:bold;">Rate</th>
         <th style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;width:12%;font-weight:bold;">Amount</th>`
      : "";

    const itemRows = (order.order_items ?? [])
      .map((item, index) => {
        const iw = item.weight || 0;
        const nw = item.manual_net_weight || (iw * item.pieces_used);
        const rt = item.rate_type ?? "per_kg";
        const rate = Number(item.price_per_piece ?? 0);
        const amount = rt === "per_kg" ? rate * nw : rate * item.pieces_used;
        const rateLabel = rt === "per_kg" ? `₹${rate.toFixed(2)}/kg` : `₹${rate.toFixed(2)}/pc`;
        const priceCell = showPrice
          ? `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${rateLabel}</td>
             <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">₹${amount.toFixed(2)}</td>`
          : "";
        return `
          <tr>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${index + 1}</td>
            <td style="border:1px solid #000;padding:4px;font-size:12px;">${item.stock_name}</td>
            <td style="border:1px solid #000;padding:4px;font-size:12px;">${item.stock_code || "N/A"}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${item.stock_length || "N/A"}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${item.pieces_used}</td>
            <td style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">${nw > 0 ? nw.toFixed(3) : "-"}</td>
            ${priceCell}
          </tr>`;
      })
      .join("") || `<tr><td colspan="${colSpan}" style="border:1px solid #000;padding:4px;text-align:center;font-size:12px;">No items</td></tr>`;

    const totalPcs = (order.order_items ?? []).reduce((s, i) => s + i.pieces_used, 0);
    const totalNW = (order.order_items ?? []).reduce((s, i) => s + (i.manual_net_weight || (i.weight || 0) * i.pieces_used), 0);
    const subtotalCell = showPrice
      ? `<td colspan="2" style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;font-weight:bold;">₹${order.subtotal?.toFixed(2) ?? "0.00"}</td>`
      : "";

    const additionalCostRows = showPrice
      ? (order.order_additional_costs ?? [])
        .map(
          (c) =>
            `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">${c.label}</td>
               <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">${c.type === "discount" ? "-" : "+"}₹${Number(c.amount).toFixed(2)}</td></tr>`
        )
        .join("")
      : "";

    const gstRows = showPrice && order.gst_enabled
      ? `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;font-weight:bold;">Subtotal</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;font-weight:bold;">₹${order.raw_total?.toFixed(2) ?? "0.00"}</td></tr>
         <tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">GST (${order.gst_percentage ?? 0}%)</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">₹${order.gst_amount?.toFixed(2) ?? "0.00"}</td></tr>`
      : "";

    const roundRow = showPrice && order.rounding_adjustment
      ? `<tr><td style="padding:3px;border-bottom:1px solid #eaeaea;">Round Off</td>
           <td style="padding:3px;border-bottom:1px solid #eaeaea;text-align:right;">${order.rounding_adjustment > 0 ? "+" : ""}₹${order.rounding_adjustment.toFixed(2)}</td></tr>`
      : "";

    const totalsBlock = showPrice
      ? `<div style="width:40%;float:right;margin-top:10px;">
           <table style="width:100%;border-collapse:collapse;font-size:11px;">
             ${additionalCostRows}${gstRows}${roundRow}
             <tr><td style="padding:5px 3px;font-weight:bold;border-top:2px solid #000;">Grand Total</td>
               <td style="padding:5px 3px;font-weight:bold;text-align:right;border-top:2px solid #000;">₹${order.total_amount?.toFixed(2) ?? "0.00"}</td></tr>
           </table>
           <div style="clear:both;"></div>
         </div>
         <div style="clear:both;"></div>`
      : "";

    const html = `<!DOCTYPE html><html><head><title>Order Invoice - ${order.customer_name}</title>
      <style>
        @media print { body{margin:0} @page{size:A4;margin:10mm} button{display:none} }
        body{font-family:Arial,sans-serif;background:#fff;color:#000;font-size:12px;}
        table{page-break-inside:avoid;}
      </style></head><body>
      <div style="max-width:800px;margin:0 auto;padding:15px;">
        <div style="text-align:center;margin-bottom:20px;border-bottom:1px solid #000;padding-bottom:10px;">
          ${companySettings ? `<h1 style="margin:0;font-size:24px;font-weight:bold;">${companySettings.company_name}</h1>
          <p style="margin:2px 0;font-size:11px;">${companySettings.company_address}</p>
          <p style="margin:2px 0;font-size:11px;">GSTIN: ${companySettings.company_gstin}</p>` : ""}
          <h2 style="margin:10px 0 0;font-size:18px;font-weight:bold;text-decoration:underline;">Delivery Details</h2>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
          <div style="width:48%;">
            ${order.site_name ? `<p style="margin:2px 0;font-size:13px;font-weight:bold;"><strong>Site Name:</strong> ${order.site_name}</p>` : `<div style="margin-top:4px;font-size:11px;display:flex;align-items:center;"><strong>Site Name:</strong> <div style="border:1px solid #000;width:100px;height:12px;margin-left:4px;"></div></div>`}
            <h3 style="margin:7px 0 5px;font-size:13px;font-weight:bold;">Customer Details:</h3>
            <p style="margin:2px 0;font-size:11px;"><strong>Name:</strong> ${order.customer_name}</p>
            ${order.customer_address ? `<p style="margin:2px 0;font-size:11px;"><strong>Address:</strong> ${order.customer_address}</p>` : ""}
            ${order.customer_gstin ? `<p style="margin:2px 0;font-size:11px;"><strong>GSTIN:</strong> ${order.customer_gstin}</p>` : ""}
            ${mobileNo ? `<p style="margin:2px 0;font-size:11px;"><strong>Mobile:</strong> ${mobileNo}</p>` : ""}
          </div>
          <div style="width:48%;text-align:right;">
            <h3 style="margin:0 0 5px;font-size:13px;font-weight:bold;">Order Details:</h3>
            <p style="margin:2px 0;font-size:11px;"><strong>Serial No:</strong> #${order.order_number || "N/A"}</p>
            <p style="margin:2px 0;font-size:11px;"><strong>Date:</strong> ${order.order_date}</p>
            ${order.color_code ? `<p style="margin:2px 0;font-size:11px;"><strong>Color:</strong> ${order.color_code}</p>` : ""}
            ${order.vehicle_number ? `<p style="margin:2px 0;font-size:11px;"><strong>Vehicle:</strong> ${order.vehicle_number}</p>` : ""}
            ${order.agent_name ? `<p style="margin:2px 0;font-size:11px;"><strong>Agent:</strong> ${order.agent_name}</p>` : ""}
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
           ${showPrice ? `<td style="border:1px solid #000;padding:3px;text-align:center;font-size:10px;"></td>` : ""}
              ${subtotalCell}
            </tr>
          </tfoot>
        </table>
        ${totalsBlock}
        ${companySettings?.dealer_logo_1 || companySettings?.dealer_logo_2 ? `
        <div style="margin-top:20px; border-top:1px solid #eee; padding-top:10px;">
          <h3 style="margin:0 0 10px; font-size:12px; text-align:center; font-weight:bold; color:#333;">${companySettings?.authorized_dealers_label || 'Authorized Dealers'}</h3>
          <div style="display:flex; justify-content:center; gap:40px; align-items:center;">
            ${companySettings?.dealer_logo_1 ? `<img src="${companySettings.dealer_logo_1}" style="max-height:60px; max-width:200px; object-fit:contain;" />` : ''}
            ${companySettings?.dealer_logo_2 ? `<img src="${companySettings.dealer_logo_2}" style="max-height:60px; max-width:200px; object-fit:contain;" />` : ''}
          </div>
        </div>` : ''}
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

  const handlePrintSelectedOrders = () => {
    if (selectedOrders.size === 0) {
      alert("Please select orders to print");
      return;
    }

    const selectedOrdersList = orders.filter((order) =>
      selectedOrders.has(order.id)
    );
    const totalOrders = selectedOrdersList.length;
    const totalItems = selectedOrdersList.reduce(
      (total, order) =>
        total +
        (order.order_items?.reduce(
          (orderTotal, item) => orderTotal + item.pieces_used,
          0
        ) || 0),
      0
    );

    const printContent = `
      <div style="padding: 8px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: bold;">MULTIPLE ORDERS REPORT</h1>
          <p style="margin: 2px 0; font-size: 16px;">Total Orders: ${totalOrders} | Total Items: ${totalItems}</p>
        </div>
        
        <div style="margin-bottom: 6px; padding: 4px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 1px 0; font-weight: bold; width: 25%;">Date:</td>
              <td style="padding: 1px 0; width: 25%;">${new Date().toLocaleDateString()}</td>
              <td style="padding: 1px 0; font-weight: bold; width: 25%;">Time:</td>
              <td style="padding: 1px 0; width: 25%;">${new Date().toLocaleTimeString()}</td>
            </tr>
          </table>
        </div>

        ${selectedOrdersList
        .map(
          (order, index) => `
          <div style="margin-bottom: 8px; page-break-inside: avoid;">
            <div style="background-color: #f0f0f0; padding: 3px; border: 1px solid #000; font-weight: bold; font-size: 16px;">
              Order #${index + 1} - ${order.customer_name} - ${order.order_date
            }${order.color_code ? ` - Color: ${order.color_code}` : ""}${order.site_name ? ` - Site Name: ${order.site_name}` : ` <div style="display:inline-block; border:1px solid #000; width:100px; height:14px; margin-left: 5px;"></div>`}
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 4px;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="border: 1px solid #000; padding: 2px; text-align: left; font-weight: bold; font-size: 16px; width: 8%;">Code</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: left; font-weight: bold; font-size: 16px; width: 52%;">Item</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 16px; width: 20%;">Len</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 16px; width: 20%;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items
              ?.map(
                (item) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px; font-weight: bold; font-size: 16px; white-space: nowrap;">${item.stock_code || "N/A"
                  }</td>
                    <td style="border: 1px solid #000; padding: 2px; font-size: 16px; max-width: 0; overflow: hidden; text-overflow: ellipsis;">${item.stock_name
                  }</td>
                    <td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 16px; white-space: nowrap;">${item.stock_length || "N/A"
                  }</td>
                    <td style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 16px; white-space: nowrap;">${item.pieces_used
                  }</td>
                  </tr>
                `
              )
              .join("") ||
            '<tr><td colspan="4" style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 16px;">No items</td></tr>'
            }
              </tbody>
              <tfoot>
                <tr style="background-color: #f0f0f0;">
                  <td colspan="3" style="border: 1px solid #000; padding: 2px; font-weight: bold; text-align: right; font-size: 16px;">Order Total:</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 10px;">
                    ${order.order_items?.reduce(
              (total, item) => total + item.pieces_used,
              0
            ) || 0
            }
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        `
        )
        .join("")}

        <div style="margin-top: 8px; padding: 4px; border: 2px solid #000; background-color: #f0f0f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px; font-weight: bold; font-size: 16px;">GRAND TOTAL:</td>
              <td style="padding: 2px; text-align: right; font-weight: bold; font-size: 16px;">${totalOrders} Orders</td>
              <td style="padding: 2px; text-align: right; font-weight: bold; font-size: 16px;">${totalItems} Items</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 8px; text-align: center; font-size: 8px; color: #666;">
          Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
      </div>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Multiple Orders Report - ${new Date().toLocaleDateString()}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 10mm; }
              }
              body { font-family: Arial, sans-serif; }
              table { page-break-inside: avoid; }
              .order-section { page-break-inside: avoid; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const isAddItemDisabled =
    !selectedStock ||
    pieces <= 0 ||
    pieces > (selectedStock?.quantity || 0) ||
    orderItems.some((item) => item.stock_id === selectedStock?.id);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showTodayOnly ? "default" : "outline"}
            onClick={toggleTodayFilter}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Today's Orders</span>
          </Button>
          <Button
            variant={showHiddenOrders ? "default" : "outline"}
            onClick={toggleHiddenOrders}
            className="flex items-center space-x-2"
          >
            <span>
              {showHiddenOrders ? "Show Visible Orders" : "Show Hidden Orders"}
            </span>
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create New Order</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">
                  Create New Order
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Input with Suggestions */}
                  <div className="relative">
                    <Label htmlFor="customer-input">Customer Name</Label>
                    <Input
                      id="customer-input"
                      value={customerInput}
                      onChange={(e) => handleCustomerInputChange(e.target.value)}
                      onKeyDown={handleCustomerKeyDown}
                      onFocus={() => setShowCustomerSuggestions(true)}
                      placeholder="Type customer name..."
                      className="w-full"
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
                                className={`p-2 cursor-pointer ${index === selectedCustomerIndex
                                  ? "bg-blue-100"
                                  : "hover:bg-gray-100"
                                  }`}
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
                    {customerNameError && (
                      <p className="text-sm text-red-500 mt-1">{customerNameError}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mobile-number">Mobile Number</Label>
                    <Input
                      id="mobile-number"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        if (mobileError) setMobileError("");
                      }}
                      placeholder="Enter mobile number"
                      autoComplete="off"
                      className={mobileError ? "border-red-500" : ""}
                    />
                    {mobileError && (
                      <p className="text-sm text-red-500 mt-1">{mobileError}</p>
                    )}
                  </div>


                  <div>
                    <Label htmlFor="customer-address">Address</Label>
                    <Input
                      id="customer-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter address"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-gstin">GSTIN Number</Label>
                    <Input
                      id="customer-gstin"
                      value={customerGstin}
                      onChange={(e) => {
                        setCustomerGstin(e.target.value);
                        if (gstinError) setGstinError("");
                      }}
                      placeholder="Enter GSTIN number"
                      autoComplete="off"
                      className={gstinError ? "border-red-500" : ""}
                    />
                    {gstinError && (
                      <p className="text-sm text-red-500 mt-1">{gstinError}</p>
                    )}
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="order-date">Date</Label>
                    <Input
                      id="order-date"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color-code">Color Code</Label>
                    <Input
                      id="color-code"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const vehicleInput = document.getElementById("vehicle-number");
                          if (vehicleInput) vehicleInput.focus();
                        }
                      }}
                      placeholder="Enter color code"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle-number">Vehicle Number</Label>
                    <Input
                      id="vehicle-number"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="Enter vehicle number"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="Enter agent name"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Enter site name"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">Add Items to Order</h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="stock-length-filter">Length</Label>
                      <Select
                        value={stockLengthFilter}
                        onValueChange={(v) => {
                          setStockLengthFilter(v);
                          setSelectedStock(null);
                          setShowStockSuggestions(true);
                        }}
                      >
                        <SelectTrigger id="stock-length-filter">
                          <SelectValue placeholder="All lengths" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All lengths</SelectItem>
                          {dynamicLengthOptions.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative md:col-span-1 lg:col-span-1">
                      <Label htmlFor="stock-search">Search Stock</Label>
                      <Input
                        id="stock-search"
                        value={stockSearch}
                        onChange={(e) => {
                          setStockSearch(e.target.value);
                          setShowStockSuggestions(true);
                          setSelectedStockIndex(-1);
                        }}
                        onKeyDown={handleStockKeyDown}
                        onFocus={() => setShowStockSuggestions(true)}
                        placeholder="Search by name or code"
                        autoComplete="off"
                      />
                      {showStockSuggestions &&
                        stockSearch &&
                        filteredStocks.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {filteredStocks.slice(0, 5).map((stock, index) => (
                              <div
                                key={stock.id}
                                data-stock-index={index}
                                className={`p-2 cursor-pointer ${index === selectedStockIndex
                                  ? "bg-blue-100"
                                  : "hover:bg-gray-100"
                                  }`}
                                onClick={() => handleStockSelect(stock)}
                              >
                                <div className="font-medium">{stock.name}</div>
                                <div className="text-sm text-gray-600">
                                  {stock.code} - {stock.length} -{" "}
                                  {stock.quantity} available
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    <div>
                      <Label htmlFor="pieces">Pieces</Label>
                      <Input
                        id="pieces"
                        type="number"
                        value={pieces === 0 ? "" : pieces}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newQuantity =
                            value === "" ? 0 : parseInt(value) || 0;
                          setPieces(newQuantity);
                          if (selectedStock)
                            validateStockQuantity(newQuantity, selectedStock);

                          // Auto update net weight
                          if (newQuantity > 0 && itemWeight) {
                            setManualNetWeight(Number((itemWeight * newQuantity).toFixed(3)));
                          } else {
                            setManualNetWeight("");
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!isAddItemDisabled) {
                              addItemToOrder();
                            }
                          }
                        }}
                        placeholder="Enter quantity"
                        min="1"
                        autoComplete="off"
                      />
                      {stockError && (
                        <p className="text-sm text-red-600 mt-1">
                          {stockError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="item-weight">Weight (kg)</Label>
                      <Input
                        id="item-weight"
                        type="number"
                        step="0.01"
                        value={itemWeight || ""}
                        onChange={(e) => {
                          const newW = Number(e.target.value) || undefined;
                          setItemWeight(newW);
                          if (pieces > 0 && newW) {
                            setManualNetWeight(Number((newW * pieces).toFixed(3)));
                          }
                        }}
                        placeholder={selectedStock?.weight ? `${selectedStock.weight} (from stock)` : "Enter weight"}
                        min="0"
                        disabled={false}
                      />
                    </div>

                    <div>
                      <Label htmlFor="item-net-weight">Net Weight (kg)</Label>
                      <Input
                        id="item-net-weight"
                        type="number"
                        step="0.001"
                        value={manualNetWeight}
                        onChange={(e) => {
                          const newNetW = Number(e.target.value) || 0;
                          setManualNetWeight(newNetW || "");
                          if (pieces > 0 && newNetW > 0) {
                            setItemWeight(Number((newNetW / pieces).toFixed(3)));
                          }
                        }}
                        placeholder={(itemWeight && pieces) ? (itemWeight * pieces).toFixed(3) : "Enter net weight"}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rate-type-create">Rate Type</Label>
                      <Select
                        value={rateType}
                        onValueChange={(v) => setRateType(v as "per_pc" | "per_kg")}
                      >
                        <SelectTrigger id="rate-type-create">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_kg">Rate / kg</SelectItem>
                          <SelectItem value="per_pc">Rate / pc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price">
                        {rateType === "per_kg" ? "Rate (₹/kg)" : "Rate (₹/pc)"}
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={pricePerPiece}
                        onChange={(e) => setPricePerPiece(Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!isAddItemDisabled) {
                              addItemToOrder();
                            }
                          }
                        }}
                        placeholder={rateType === "per_kg" ? "Price per kg" : "Price per piece"}
                        min="0"
                      />
                      {pricePerPiece !== "" && pricePerPiece > 0 && pieces > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {rateType === "per_kg"
                            ? (() => {
                              const iw = itemWeight || selectedStock?.weight || 0;
                              const nw = manualNetWeight || (iw * pieces);
                              return nw > 0
                                ? `Est. ₹${(Number(pricePerPiece) * nw).toFixed(2)} (${nw.toFixed(2)} kg × ₹${pricePerPiece}/kg)`
                                : "Enter weight to see estimate";
                            })()
                            : `Est. ₹${(Number(pricePerPiece) * pieces).toFixed(2)}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={addItemToOrder}
                        className="w-full"
                        disabled={isAddItemDisabled}
                      >
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Current Order Items */}
                  {orderItems.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {orderItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {item.stock_name}
                              </span>
                              <span className="text-gray-600 ml-2">
                                ({item.stock_code}) - {item.stock_length} -{" "}
                                {item.pieces_used} pieces
                              </span>
                              {(item.weight || item.price_per_piece > 0) && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {(item.weight || item.manual_net_weight) && <span>Weight: {item.manual_net_weight || (item.weight * item.pieces_used).toFixed(2)}kg </span>}
                                  {item.price_per_piece > 0 && <span>Price: ₹{item.price_per_piece}</span>}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItemFromOrder(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing & GST Section */}
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                  <h3 className="text-lg font-semibold border-bottom pb-2">Pricing & GST</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="flex items-center space-x-2 h-10">
                      <Switch
                        id="gst-enabled"
                        checked={gstEnabled}
                        onCheckedChange={setGstEnabled}
                      />
                      <Label htmlFor="gst-enabled">Enable GST</Label>
                    </div>

                    {gstEnabled && (
                      <>
                        <div>
                          <Label htmlFor="gst-type">GST Type</Label>
                          <Select
                            value={gstType}
                            onValueChange={(value) => setGstType(value as "CGST_SGST" | "IGST" | "UTGST")}
                          >
                            <SelectTrigger id="gst-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                              <SelectItem value="IGST">IGST</SelectItem>
                              <SelectItem value="UTGST">UTGST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="gst-percentage">GST %</Label>
                          <div className="relative">
                            <Input
                              id="gst-percentage"
                              type="number"
                              value={gstPercentage}
                              onChange={(e) => setGstPercentage(Number(e.target.value))}
                              className="pr-8"
                            />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center space-x-2 h-10">
                      <Switch
                        id="show-unit-price"
                        checked={showUnitPrice}
                        onCheckedChange={setShowUnitPrice}
                      />
                      <Label htmlFor="show-unit-price">Show Unit Price on Print</Label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-gray-700">Additional Costs / Discounts</h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1">
                        <Label htmlFor="cost-label">Label</Label>
                        <Input
                          id="cost-label"
                          value={newCostLabel}
                          onChange={(e) => setNewCostLabel(e.target.value)}
                          placeholder="e.g. Transport, Discount"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost-type">Type</Label>
                        <Select
                          value={newCostType}
                          onValueChange={(value) => setNewCostType(value as "add" | "discount")}
                        >
                          <SelectTrigger id="cost-type">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Addition (+)</SelectItem>
                            <SelectItem value="discount">Discount (-)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cost-amount">Amount (₹)</Label>
                        <div className="relative">
                          <Input
                            id="cost-amount"
                            type="number"
                            value={newCostAmount}
                            onChange={(e) => setNewCostAmount(Number(e.target.value))}
                            className="pl-8"
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addAdditionalCost}
                        disabled={!newCostLabel || newCostAmount === ""}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {additionalCosts.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {additionalCosts.map((cost, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border p-2 rounded shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              {cost.type === "discount" ? (
                                <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">- Discount</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">+ Addition</Badge>
                              )}
                              <span className="font-medium">{cost.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">₹{cost.amount.toFixed(2)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAdditionalCost(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreatingOrder}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={isCreatingOrder || orderItems.length === 0}
                  >
                    {isCreatingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Order"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 self-center">
              {selectedOrders.size} order(s) selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSelectedOrders}
              className="flex items-center space-x-1"
            >
              <Printer className="h-4 w-4" />
              <span>Print Selected</span>
            </Button>
            {showHiddenOrders ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkShow}
                className="flex items-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>Show Selected</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkHide}
                className="flex items-center space-x-1"
              >
                <EyeOff className="h-4 w-4" />
                <span>Hide Selected</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected</span>
            </Button>
          </div>
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          } else {
            setIsEditDialogOpen(open);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              Edit Order
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Input with Suggestions */}
              <div className="relative">
                <Label htmlFor="edit-customer-input">Customer Name</Label>
                <Input
                  id="edit-customer-input"
                  value={customerInput}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  onKeyDown={handleCustomerKeyDown}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  placeholder="Type customer name..."
                  className="w-full"
                  autoComplete="off"
                />
                {showCustomerSuggestions &&
                  customerInput &&
                  filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.slice(0, 5).map((customer, index) => (
                        <div
                          key={customer.id}
                          data-customer-index={index}
                          className={`p-2 cursor-pointer ${index === selectedCustomerIndex
                            ? "bg-blue-100"
                            : "hover:bg-gray-100"
                            }`}
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
                {customerNameError && (
                  <p className="text-sm text-red-500 mt-1">{customerNameError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-mobile-number">Mobile Number</Label>
                <Input
                  id="edit-mobile-number"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (mobileError) setMobileError("");
                  }}
                  placeholder="Enter mobile number"
                  autoComplete="off"
                  className={mobileError ? "border-red-500" : ""}
                />
                {mobileError && (
                  <p className="text-sm text-red-500 mt-1">{mobileError}</p>
                )}
              </div>


              <div>
                <Label htmlFor="edit-customer-address">Address</Label>
                <Input
                  id="edit-customer-address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter address"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="edit-customer-gstin">GSTIN Number</Label>
                <Input
                  id="edit-customer-gstin"
                  value={customerGstin}
                  onChange={(e) => {
                    setCustomerGstin(e.target.value);
                    if (gstinError) setGstinError("");
                  }}
                  placeholder="Enter GSTIN number"
                  autoComplete="off"
                  className={gstinError ? "border-red-500" : ""}
                />
                {gstinError && (
                  <p className="text-sm text-red-500 mt-1">{gstinError}</p>
                )}
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit-order-date">Date</Label>
                <Input
                  id="edit-order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-color-code">Color Code</Label>
                <Input
                  id="edit-color-code"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  placeholder="Enter color code"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="edit-vehicle-number">Vehicle Number</Label>
                <Input
                  id="edit-vehicle-number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="edit-agent-name">Agent Name</Label>
                <Input
                  id="edit-agent-name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Enter agent name"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Add Items Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Edit Order Items</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="edit-stock-length-filter">Length</Label>
                  <Select
                    value={stockLengthFilter}
                    onValueChange={(v) => {
                      setStockLengthFilter(v);
                      setSelectedStock(null);
                      setShowStockSuggestions(true);
                    }}
                  >
                    <SelectTrigger id="edit-stock-length-filter">
                      <SelectValue placeholder="All lengths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All lengths</SelectItem>
                      {dynamicLengthOptions.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative md:col-span-1 lg:col-span-1">
                  <Label htmlFor="edit-stock-search">Search Stock</Label>
                  <Input
                    id="edit-stock-search"
                    value={stockSearch}
                    onChange={(e) => {
                      setStockSearch(e.target.value);
                      setShowStockSuggestions(true);
                      setSelectedStockIndex(-1);
                    }}
                    onKeyDown={handleStockKeyDown}
                    onFocus={() => setShowStockSuggestions(true)}
                    placeholder="Search by name or code"
                    autoComplete="off"
                  />
                  {showStockSuggestions &&
                    stockSearch &&
                    filteredStocks.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredStocks.slice(0, 5).map((stock, index) => (
                          <div
                            key={stock.id}
                            data-stock-index={index}
                            className={`p-2 cursor-pointer ${index === selectedStockIndex
                              ? "bg-blue-100"
                              : "hover:bg-gray-100"
                              }`}
                            onClick={() => handleStockSelect(stock)}
                          >
                            <div className="font-medium">{stock.name}</div>
                            <div className="text-sm text-gray-600">
                              {stock.code} - {stock.length} - {stock.quantity}{" "}
                              available
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div>
                  <Label htmlFor="edit-pieces">Pieces</Label>
                  <Input
                    id="edit-pieces"
                    type="number"
                    value={pieces === 0 ? "" : pieces}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newQuantity =
                        value === "" ? 0 : parseInt(value) || 0;
                      setPieces(newQuantity);
                      if (selectedStock)
                        validateStockQuantity(newQuantity, selectedStock);
                      // Auto update net weight
                      if (newQuantity > 0 && itemWeight) {
                        setManualNetWeight(Number((itemWeight * newQuantity).toFixed(3)));
                      } else {
                        setManualNetWeight("");
                      }
                    }}
                    placeholder="Enter quantity"
                    min="1"
                    autoComplete="off"
                  />
                  {stockError && (
                    <p className="text-sm text-red-600 mt-1">{stockError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-item-weight">Weight (kg)</Label>
                  <Input
                    id="edit-item-weight"
                    type="number"
                    step="0.01"
                    value={itemWeight || ""}
                    onChange={(e) => {
                      const newW = Number(e.target.value) || undefined;
                      setItemWeight(newW);
                      if (pieces > 0 && newW) {
                        setManualNetWeight(Number((newW * pieces).toFixed(3)));
                      }
                    }}
                    placeholder={selectedStock?.weight ? `${selectedStock.weight} (from stock)` : "Enter weight"}
                    min="0"
                    disabled={false}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-net-weight">Net Weight (kg)</Label>
                  <Input
                    id="edit-net-weight"
                    type="number"
                    step="0.001"
                    value={manualNetWeight}
                    onChange={(e) => {
                      const newNetW = Number(e.target.value) || 0;
                      setManualNetWeight(newNetW || "");
                      if (pieces > 0 && newNetW > 0) {
                        setItemWeight(Number((newNetW / pieces).toFixed(3)));
                      }
                    }}
                    placeholder={(itemWeight && pieces) ? (itemWeight * pieces).toFixed(3) : "Enter net weight"}
                  />
                </div>

                <div>
                  <Label htmlFor="rate-type-edit">Rate Type</Label>
                  <Select
                    value={rateType}
                    onValueChange={(v) => setRateType(v as "per_pc" | "per_kg")}
                  >
                    <SelectTrigger id="rate-type-edit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_kg">Rate / kg</SelectItem>
                      <SelectItem value="per_pc">Rate / pc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-price">
                    {rateType === "per_kg" ? "Rate (₹/kg)" : "Rate (₹/pc)"}
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={pricePerPiece}
                    onChange={(e) => setPricePerPiece(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!isAddItemDisabled) {
                          addItemToOrder();
                        }
                      }
                    }}
                    placeholder={rateType === "per_kg" ? "Price per kg" : "Price per piece"}
                    min="0"
                  />
                  {pricePerPiece !== "" && pricePerPiece > 0 && pieces > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {rateType === "per_kg"
                        ? (() => {
                          const iw = itemWeight || selectedStock?.weight || 0;
                          const nw = manualNetWeight || (iw * pieces);
                          return nw > 0
                            ? `Est. ₹${(Number(pricePerPiece) * nw).toFixed(2)} (${nw.toFixed(2)} kg × ₹${pricePerPiece}/kg)`
                            : "Enter weight to see estimate";
                        })()
                        : `Est. ₹${(Number(pricePerPiece) * pieces).toFixed(2)}`}
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addItemToOrder}
                    className="w-full"
                    disabled={isAddItemDisabled}
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Current Order Items */}
              {orderItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <div>
                          <span className="font-medium">{item.stock_name}</span>
                          <span className="text-gray-600 ml-2">
                            ({item.stock_code}) - {item.stock_length} -{" "}
                            {item.pieces_used} pieces
                          </span>
                          {(item.weight || item.price_per_piece > 0) && (
                            <div className="text-sm text-gray-500 mt-1">
                              {(item.weight || item.manual_net_weight) && <span>Weight: {item.manual_net_weight || (item.weight * item.pieces_used).toFixed(2)}kg </span>}
                              {item.price_per_piece > 0 && <span>Price: ₹{item.price_per_piece}</span>}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromOrder(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing & GST Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
              <h3 className="text-lg font-semibold border-bottom pb-2">Pricing & GST</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="edit-gst-enabled"
                    checked={gstEnabled}
                    onCheckedChange={setGstEnabled}
                  />
                  <Label htmlFor="edit-gst-enabled">Enable GST</Label>
                </div>

                {gstEnabled && (
                  <>
                    <div>
                      <Label htmlFor="edit-gst-type">GST Type</Label>
                      <Select
                        value={gstType}
                        onValueChange={(value) => setGstType(value as "CGST_SGST" | "IGST" | "UTGST")}
                      >
                        <SelectTrigger id="edit-gst-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CGST_SGST">CGST + SGST</SelectItem>
                          <SelectItem value="IGST">IGST</SelectItem>
                          <SelectItem value="UTGST">UTGST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-gst-percentage">GST %</Label>
                      <div className="relative">
                        <Input
                          id="edit-gst-percentage"
                          type="number"
                          value={gstPercentage}
                          onChange={(e) => setGstPercentage(Number(e.target.value))}
                          className="pr-8"
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="edit-show-unit-price"
                    checked={showUnitPrice}
                    onCheckedChange={setShowUnitPrice}
                  />
                  <Label htmlFor="edit-show-unit-price">Show Unit Price on Print</Label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-gray-700">Additional Costs / Discounts</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <Label htmlFor="edit-cost-label">Label</Label>
                    <Input
                      id="edit-cost-label"
                      value={newCostLabel}
                      onChange={(e) => setNewCostLabel(e.target.value)}
                      placeholder="e.g. Transport, Discount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cost-type">Type</Label>
                    <Select
                      value={newCostType}
                      onValueChange={(value) => setNewCostType(value as "add" | "discount")}
                    >
                      <SelectTrigger id="edit-cost-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Addition (+)</SelectItem>
                        <SelectItem value="discount">Discount (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-cost-amount">Amount (₹)</Label>
                    <div className="relative">
                      <Input
                        id="edit-cost-amount"
                        type="number"
                        value={newCostAmount}
                        onChange={(e) => setNewCostAmount(Number(e.target.value))}
                        className="pl-8"
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAdditionalCost}
                    disabled={!newCostLabel || newCostAmount === ""}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {additionalCosts.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {additionalCosts.map((cost, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border p-2 rounded shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          {cost.type === "discount" ? (
                            <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">- Discount</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">+ Addition</Badge>
                          )}
                          <span className="font-medium">{cost.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">₹{cost.amount.toFixed(2)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdditionalCost(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isCreatingOrder}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrder}
                disabled={isCreatingOrder || orderItems.length === 0}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Order"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filter-customer">Customer</Label>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-date-from">From Date</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="filter-date-to">To Date</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg lg:text-xl">Recent Orders</CardTitle>
            {filteredOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="flex items-center space-x-2"
              >
                {selectedOrders.size === filteredOrders.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>Select All</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={cn(
                  "border rounded-lg p-4",
                  selectedOrders.has(order.id) && "border-blue-500 bg-blue-50",
                  order.is_hidden && "border-black"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderSelection(order.id)}
                      className="p-1 h-auto"
                    >
                      {selectedOrders.has(order.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {order.customer_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span>{" "}
                          {order.order_date}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">
                          Items:
                        </h4>
                        {order.order_items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-start gap-4 bg-gray-50 p-2 rounded text-sm"
                          >
                            <div className="">
                              <span className="font-medium">
                                ({item.stock_code || "N/A"}) {item.stock_name}
                              </span>
                              <span className="text-gray-600 ml-2">
                                - {item.stock_length || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {order.color_code && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Color: {order.color_code}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {item.pieces_used} pcs
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">
                            Total:{" "}
                            {order.order_items?.reduce(
                              (total, item) => total + item.pieces_used,
                              0
                            ) || 0}{" "}
                            pieces
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintOrder(order)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {showHiddenOrders ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowOrder(order.id)}
                        title="Show Order"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHideOrder(order.id)}
                        title="Hide Order"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Order Created Successfully!"
        message={`Order has been created successfully for ${createdOrder?.customer_name || "customer"}.`}
        showPrintOption={true}
        onPrint={() => createdOrder && handlePrintOrder(createdOrder)}
        printLabel="Print Order Invoice"
      />
    </div>
  );
};

export default OrderManager;
