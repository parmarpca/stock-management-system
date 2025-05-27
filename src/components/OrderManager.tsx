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
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Stock, Customer, Order, OrderItem } from "@/hooks/useStockData";
import { cn } from "@/lib/utils";

interface OrderManagerProps {
  stocks: Stock[];
  customers: Customer[];
  orders: Order[];
  onOrderCreate: (
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string
  ) => Promise<any>;
  onOrderUpdate: (
    orderId: string,
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string
  ) => Promise<any>;
  onOrderDelete: (orderId: string) => Promise<any>;
  onOrderHide: (orderId: string) => Promise<any>;
  onOrderShow: (orderId: string) => Promise<any>;
  onCustomerCreate: (name: string) => Promise<any>;
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
  stock_name: string;
  stock_code: string;
  stock_length: string;
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
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
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [pieces, setPieces] = useState(0);
  const [stockError, setStockError] = useState("");
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [selectedStockIndex, setSelectedStockIndex] = useState(-1);

  // Filter states
  //   const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      stock.code.toLowerCase().includes(stockSearch.toLowerCase())
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
        }
        // Move to next field after selection
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
  };

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
      stock_name: selectedStock!.name,
      stock_code: selectedStock!.code,
      stock_length: selectedStock!.length,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setStockSearch("");
    setSelectedStock(null);
    setPieces(0);
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
    setOrderItems([]);
    setOriginalOrderItems([]);
    setStockSearch("");
    setSelectedStock(null);
    setPieces(0);
    setStockError("");
    setShowCustomerSuggestions(false);
    setSelectedCustomerIndex(-1);
    setShowStockSuggestions(false);
    setSelectedStockIndex(-1);
  };

  const handleCancelEdit = () => {
    setOrderItems(originalOrderItems);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingOrder(null);
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    if (!customerInput.trim()) {
      alert("Please enter a customer name");
      return;
    }

    setIsCreatingOrder(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (!customerId && customerInput.trim()) {
        const newCustomer = await onCustomerCreate(customerInput.trim());
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Failed to get customer ID");
      }

      const items = orderItems.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
      }));

      const newOrder = await onOrderCreate(customerId, items, colorCode);
      // Ensure we have the complete order data with customer name
      const completeOrder = {
        ...newOrder,
        customer_name: selectedCustomer?.name || customerInput,
        color_code: colorCode,
        order_items: items.map((item) => ({
          ...item,
          stock_name:
            orderItems.find((oi) => oi.stock_id === item.stock_id)
              ?.stock_name || "",
          stock_code:
            orderItems.find((oi) => oi.stock_id === item.stock_id)
              ?.stock_code || "",
          stock_length:
            orderItems.find((oi) => oi.stock_id === item.stock_id)
              ?.stock_length || "",
        })),
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
    const items =
      order.order_items?.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
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

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    if (!customerInput.trim()) {
      alert("Please enter a customer name");
      return;
    }

    setIsCreatingOrder(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (!customerId && customerInput.trim()) {
        const newCustomer = await onCustomerCreate(customerInput.trim());
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error("Failed to get customer ID");
      }

      const items = orderItems.map((item) => ({
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
      }));

      await onOrderUpdate(editingOrder.id, customerId, items, colorCode);
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
    const printContent = `
      <div style="padding: 10px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold;">ORDER RECEIPT</h1>
        </div>
        
        <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; font-weight: bold; width: 20%;">Date:</td>
              <td style="padding: 2px 0; width: 30%;">${order.order_date}</td>
              <td style="padding: 2px 0; font-weight: bold; width: 20%;">Time:</td>
              <td style="padding: 2px 0; width: 30%;">${new Date().toLocaleTimeString()}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: bold;">Customer:</td>
              <td style="padding: 2px 0;">${order.customer_name}</td>
              ${
                order.color_code
                  ? `<td style="padding: 2px 0; font-weight: bold;">Color:</td>
                     <td style="padding: 2px 0;">${order.color_code}</td>`
                  : `<td colspan="2"></td>`
              }
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 10px;">
          <h2 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-weight: bold; font-size: 12px; width: 15%;">Code</th>
                <th style="border: 1px solid #000; padding: 2px 4px; text-align: left; font-weight: bold; font-size: 12px; width: 45%;">Item Name</th>
                <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-weight: bold; font-size: 12px; width: 20%;">Length</th>
                <th style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-weight: bold; font-size: 12px; width: 20%;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${
                order.order_items
                  ?.map(
                    (item) =>
                      `<tr>
                        <td style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; font-size: 12px; white-space: nowrap;">${
                          item.stock_code || "N/A"
                        }</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; font-size: 12px; max-width: 0; overflow: hidden; text-overflow: ellipsis;">${
                          item.stock_name
                        }</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 12px; white-space: nowrap;">${
                          item.stock_length || "N/A"
                        }</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-weight: bold; font-size: 12px; white-space: nowrap;">${
                          item.pieces_used
                        }</td>
                      </tr>`
                  )
                  .join("") ||
                "<tr><td colspan='4' style='border: 1px solid #000; padding: 2px 4px; text-align: center; font-size: 12px;'>No items</td></tr>"
              }
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0;">
                <td colspan="3" style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; text-align: right; font-size: 12px;">Total:</td>
                <td style="border: 1px solid #000; padding: 2px 4px; text-align: center; font-weight: bold; font-size: 12px;">
                  ${
                    order.order_items?.reduce(
                      (total, item) => total + item.pieces_used,
                      0
                    ) || 0
                  }
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top: 15px; text-align: center; font-size: 10px; color: #666;">
          Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
      </div>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt - ${order.customer_name}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { size: B5; margin: 10mm; }
              }
              body { font-family: Arial, sans-serif; }
              table { page-break-inside: avoid; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
          <p style="margin: 2px 0; font-size: 12px;">Total Orders: ${totalOrders} | Total Items: ${totalItems}</p>
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
            <div style="background-color: #f0f0f0; padding: 3px; border: 1px solid #000; font-weight: bold; font-size: 12px;">
              Order #${index + 1} - ${order.customer_name} - ${
              order.order_date
            }${order.color_code ? ` - Color: ${order.color_code}` : ""}
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 4px;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="border: 1px solid #000; padding: 2px; text-align: left; font-weight: bold; font-size: 12px; width: 15%;">Code</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: left; font-weight: bold; font-size: 12px; width: 45%;">Item</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 12px; width: 20%;">Len</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 12px; width: 20%;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${
                  order.order_items
                    ?.map(
                      (item) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px; font-weight: bold; font-size: 12px; white-space: nowrap;">${
                      item.stock_code || "N/A"
                    }</td>
                    <td style="border: 1px solid #000; padding: 2px; font-size: 12px; max-width: 0; overflow: hidden; text-overflow: ellipsis;">${
                      item.stock_name
                    }</td>
                    <td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 12px; white-space: nowrap;">${
                      item.stock_length || "N/A"
                    }</td>
                    <td style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 12px; white-space: nowrap;">${
                      item.pieces_used
                    }</td>
                  </tr>
                `
                    )
                    .join("") ||
                  '<tr><td colspan="4" style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 12px;">No items</td></tr>'
                }
              </tbody>
              <tfoot>
                <tr style="background-color: #f0f0f0;">
                  <td colspan="3" style="border: 1px solid #000; padding: 2px; font-weight: bold; text-align: right; font-size: 12px;">Order Total:</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold; font-size: 10px;">
                    ${
                      order.order_items?.reduce(
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
              <td style="padding: 2px; font-weight: bold; font-size: 12px;">GRAND TOTAL:</td>
              <td style="padding: 2px; text-align: right; font-weight: bold; font-size: 12px;">${totalOrders} Orders</td>
              <td style="padding: 2px; text-align: right; font-weight: bold; font-size: 12px;">${totalItems} Items</td>
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
                @page { size: B5; margin: 10mm; }
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
                              className={`p-2 cursor-pointer ${
                                index === selectedCustomerIndex
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
                        const stockSearchInput =
                          document.getElementById("stock-search");
                        if (stockSearchInput) stockSearchInput.focus();
                      }
                    }}
                    placeholder="Enter color code"
                    autoComplete="off"
                  />
                </div>

                {/* Add Items Section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">Add Items to Order</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
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
                                className={`p-2 cursor-pointer ${
                                  index === selectedStockIndex
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
                        className={`p-2 cursor-pointer ${
                          index === selectedCustomerIndex
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

            {/* Add Items Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Edit Order Items</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
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
                            className={`p-2 cursor-pointer ${
                              index === selectedStockIndex
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
                    }}
                    placeholder="Enter quantity"
                    min="1"
                    autoComplete="off"
                  />
                  {stockError && (
                    <p className="text-sm text-red-600 mt-1">{stockError}</p>
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
        message={`Order has been created successfully for ${
          createdOrder?.customer_name || "customer"
        }.`}
        showPrintOption={true}
        onPrint={() => createdOrder && handlePrintOrder(createdOrder)}
      />
    </div>
  );
};

export default OrderManager;
