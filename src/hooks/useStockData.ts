import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stockLength } from "@/constants/config";

export interface Stock {
  id: string;
  name: string;
  code: string;
  length: stockLength;
  quantity: number;
  weight?: number; // Weight in kg
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address?: string;
  gstin_number?: string;
  mobile_number?: string;
  created_at: string;
}

export interface OrderAdditionalCost {
  id: string;
  order_id: string;
  label: string;
  type: "add" | "discount";
  amount: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  stock_id: string;
  pieces_used: number;
  price_per_piece: number;
  subtotal?: number;
  weight?: number;
  stock_name?: string;
  stock_code?: string;
  stock_length?: string;
  is_from_stock_table?: boolean;
  rate_type?: "per_pc" | "per_kg";
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  color_code?: string;
  vehicle_number?: string;
  agent_name?: string;
  customer_name?: string;
  customer_address?: string;
  customer_gstin?: string;
  subtotal?: number;
  gst_enabled?: boolean;
  gst_type?: "CGST_SGST" | "IGST" | "UTGST";
  gst_percentage?: number;
  gst_amount?: number;
  total_amount?: number;
  raw_total?: number;
  rounding_adjustment?: number;
  show_unit_price?: boolean;
  order_items?: OrderItem[];
  order_additional_costs?: OrderAdditionalCost[];
  is_hidden?: boolean;
  site_name?: string;
}

export const useStockData = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStocks = async () => {
    try {
      const { data, error } = await supabase
        .from("stocks")
        .select("*")
        .order("name");

      if (error) throw error;
      setStocks(data || []);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchOrders = async (
    includeHidden: boolean = false,
    showTodayOnly: boolean = true
  ) => {
    try {
      let query = supabase.from("orders").select(`
          *,
          customers(name, address, gstin_number),
          order_items(
            id,
            stock_id,
            pieces_used,
            price_per_piece,
            subtotal,
            weight,
            stock_name,
            stock_code,
            stock_length,
            is_from_stock_table,
            rate_type
          ),
          order_additional_costs(*)
        `);

      if (!includeHidden) {
        query = query.eq("is_hidden", false);
      }

      if (showTodayOnly) {
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("order_date", today);
      }

      const { data: ordersData, error: ordersError } = await query.order(
        "created_at",
        { ascending: false }
      );

      if (ordersError) throw ordersError;

      const formattedOrders: Order[] =
        ordersData?.map((order: {
          id: string;
          customer_id: string;
          order_date: string;
          color_code?: string;
          vehicle_number?: string;
          agent_name?: string;
          gst_enabled?: boolean;
          gst_type?: "CGST_SGST" | "IGST" | "UTGST";
          gst_percentage?: number;
          gst_amount?: number;
          total_amount?: number;
          raw_total?: number;
          subtotal?: number;
          rounding_adjustment?: number;
          show_unit_price?: boolean;
          is_hidden?: boolean;
          site_name?: string;
          customers?: { name?: string; address?: string; gstin_number?: string };
          order_items?: (OrderItem & { stocks?: { name?: string; code?: string; length?: string } })[];
          order_additional_costs?: OrderAdditionalCost[];
        }) => ({
          ...order,
          customer_name: order.customers?.name,
          customer_address: order.customers?.address,
          customer_gstin: order.customers?.gstin_number,
          order_items: order.order_items?.map((item) => ({
            ...item,
            stock_name: item.stock_name || item.stocks?.name,
            stock_code: item.stock_code || item.stocks?.code,
            stock_length: item.stock_length || item.stocks?.length,
          })),
          order_additional_costs: order.order_additional_costs,
        })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const createCustomer = async (name: string, mobile_number?: string) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name, mobile_number }])
        .select()
        .single();

      if (error) throw error;

      await fetchCustomers();
      return data;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  };

  const createOrUpdateStock = async (stockData: {
    name: string;
    code: string;
    length: stockLength;
    quantity: number;
    weight?: number;
  }) => {
    try {
      // Unique key is the combination of code + length
      const { data: existingStock, error: checkError } = await supabase
        .from("stocks")
        .select("*")
        .eq("code", stockData.code)
        .eq("length", stockData.length)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingStock) {
        // Same code AND same length → add to existing quantity
        const { data, error } = await supabase
          .from("stocks")
          .update({
            quantity: existingStock.quantity + stockData.quantity,
            name: stockData.name,
            weight: stockData.weight,
          })
          .eq("id", existingStock.id)
          .select()
          .single();

        if (error) throw error;
        await fetchStocks();
        return data;
      } else {
        // Different code, or same code but different length → create new row
        const { data, error } = await supabase
          .from("stocks")
          .insert([stockData])
          .select()
          .single();

        if (error) throw error;
        await fetchStocks();
        return data;
      }
    } catch (error) {
      console.error("Error creating/updating stock:", error);
      throw error;
    }
  };

  const createOrder = async (
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string,
    vehicleNumber?: string,
    agentName?: string,
    gstEnabled: boolean = false,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage: number = 18.00,
    showUnitPrice: boolean = true,
    additionalCosts?: Omit<OrderAdditionalCost, "id" | "order_id">[],
    customerAddress?: string,
    customerGstin?: string,
    orderDate?: string,
    siteName?: string
  ) => {
    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: customerId,
          color_code: colorCode,
          vehicle_number: vehicleNumber,
          agent_name: agentName,
          gst_enabled: gstEnabled,
          gst_type: gstType,
          gst_percentage: gstPercentage,
          show_unit_price: showUnitPrice,
          site_name: siteName,
          ...(orderDate ? { order_date: orderDate } : {}),
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Update customer address and GSTIN if provided
      if (customerAddress || customerGstin) {
        const updateData: { address?: string; gstin_number?: string } = {};
        if (customerAddress) updateData.address = customerAddress;
        if (customerGstin) updateData.gstin_number = customerGstin;

        await supabase
          .from("customers")
          .update(updateData)
          .eq("id", customerId);

        await fetchCustomers();
      }

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
        price_per_piece: item.price_per_piece,
        weight: item.weight,
        stock_name: item.stock_name,
        stock_code: item.stock_code,
        stock_length: item.stock_length,
        is_from_stock_table: item.is_from_stock_table,
        rate_type: item.rate_type ?? "per_kg",
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems.map(item => ({ ...item, is_from_stock_table: item.is_from_stock_table ?? true })));

      if (itemsError) throw itemsError;

      // Add additional costs
      if (additionalCosts && additionalCosts.length > 0) {
        const costsToInsert = additionalCosts.map(cost => ({
          order_id: orderData.id,
          label: cost.label,
          type: cost.type,
          amount: cost.amount
        }));

        const { error: costsError } = await supabase
          .from("order_additional_costs")
          .insert(costsToInsert);

        if (costsError) throw costsError;
      }

      // Calculate totals using the database function
      const { error: calcError } = await supabase.rpc(
        "update_order_totals",
        { order_uuid: orderData.id }
      );

      if (calcError) throw calcError;

      // Update stock quantities and weights
      for (const item of items) {
        // First get current quantity
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity - item.pieces_used;

        const updateData: { quantity: number; weight?: number } = { quantity: newQuantity };
        if (item.weight) {
          updateData.weight = item.weight;
        }

        const { error: updateError } = await supabase
          .from("stocks")
          .update(updateData)
          .eq("id", item.stock_id);

        if (updateError) throw updateError;
      }

      // Refresh data
      await Promise.all([fetchStocks(), fetchOrders()]);

      return orderData;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStocks(),
        fetchCustomers(),
        fetchOrders(false, true),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const deleteOrder = async (orderId: string) => {
    try {
      // First get order items to restore stock quantities
      const { data: orderItems, error: fetchError } = await supabase
        .from("order_items")
        .select("stock_id, pieces_used")
        .eq("order_id", orderId);

      if (fetchError) throw fetchError;

      // Restore stock quantities
      for (const item of orderItems || []) {
        // Get current quantity
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity + item.pieces_used;

        const { error: updateError } = await supabase
          .from("stocks")
          .update({ quantity: newQuantity })
          .eq("id", item.stock_id);

        if (updateError) throw updateError;
      }

      // Delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Refresh data
      await Promise.all([fetchStocks(), fetchOrders()]);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  };

  const deleteStock = async (stockId: string) => {
    try {
      const { error } = await supabase
        .from("stocks")
        .delete()
        .eq("id", stockId);

      if (error) throw error;

      // Refresh stocks
      await fetchStocks();
    } catch (error) {
      console.error("Error deleting stock:", error);
      throw error;
    }
  };

  const updateOrder = async (
    orderId: string,
    customerId: string,
    items: Omit<OrderItem, "id" | "order_id">[],
    colorCode?: string,
    vehicleNumber?: string,
    agentName?: string,
    gstEnabled: boolean = false,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage: number = 18.00,
    showUnitPrice: boolean = true,
    additionalCosts?: Omit<OrderAdditionalCost, "id" | "order_id">[],
    customerAddress?: string,
    customerGstin?: string,
    siteName?: string
  ) => {
    try {
      // First get existing order items to restore stock quantities
      const { data: existingItems, error: fetchError } = await supabase
        .from("order_items")
        .select("stock_id, pieces_used, is_from_stock_table")
        .eq("order_id", orderId);

      if (fetchError) throw fetchError;

      // Restore stock quantities from existing items (only if from stock)
      for (const item of existingItems || []) {
        if (!item.is_from_stock_table || !item.stock_id) continue;
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity + item.pieces_used;

        const { error: updateError } = await supabase
          .from("stocks")
          .update({ quantity: newQuantity })
          .eq("id", item.stock_id);

        if (updateError) throw updateError;
      }

      // Update the order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          customer_id: customerId,
          color_code: colorCode,
          vehicle_number: vehicleNumber,
          agent_name: agentName,
          gst_enabled: gstEnabled,
          gst_type: gstType,
          gst_percentage: gstPercentage,
          show_unit_price: showUnitPrice,
          site_name: siteName
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Update customer address and GSTIN if provided
      if (customerAddress || customerGstin) {
        const updateData: { address?: string; gstin_number?: string } = {};
        if (customerAddress) updateData.address = customerAddress;
        if (customerGstin) updateData.gstin_number = customerGstin;

        await supabase
          .from("customers")
          .update(updateData)
          .eq("id", customerId);

        await fetchCustomers();
      }

      // Delete existing order items
      const { error: deleteItemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (deleteItemsError) throw deleteItemsError;

      // Create new order items
      const orderItems = items.map((item) => ({
        order_id: orderId,
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
        price_per_piece: item.price_per_piece,
        weight: item.weight,
        stock_name: item.stock_name,
        stock_code: item.stock_code,
        stock_length: item.stock_length,
        is_from_stock_table: item.is_from_stock_table,
        rate_type: item.rate_type ?? "per_kg",
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems.map(item => ({ ...item, is_from_stock_table: item.is_from_stock_table ?? true })));

      if (itemsError) throw itemsError;

      // Delete existing order additional costs
      const { error: deleteCostsError } = await supabase
        .from("order_additional_costs")
        .delete()
        .eq("order_id", orderId);

      if (deleteCostsError) throw deleteCostsError;

      // Create new additional costs
      if (additionalCosts && additionalCosts.length > 0) {
        const costsToInsert = additionalCosts.map(cost => ({
          order_id: orderId,
          label: cost.label,
          type: cost.type,
          amount: cost.amount
        }));

        const { error: costsError } = await supabase
          .from("order_additional_costs")
          .insert(costsToInsert);

        if (costsError) throw costsError;
      }

      // Calculate totals using the database function
      const { error: calcError } = await supabase.rpc(
        "update_order_totals",
        { order_uuid: orderId }
      );

      if (calcError) throw calcError;

      // Update stock quantities and weights for new items
      for (const item of items) {
        if (!item.is_from_stock_table || !item.stock_id) continue;
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity - item.pieces_used;

        const updateData: { quantity: number; weight?: number } = { quantity: newQuantity };
        if (item.weight) {
          updateData.weight = item.weight;
        }

        const { error: updateError } = await supabase
          .from("stocks")
          .update(updateData)
          .eq("id", item.stock_id);

        if (updateError) throw updateError;
      }

      // Refresh data
      await Promise.all([fetchStocks(), fetchOrders()]);

      return { id: orderId };
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  };

  const hideOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_hidden: true })
        .eq("id", orderId);

      if (error) throw error;

      // Refresh orders to update the UI
      await fetchOrders();
    } catch (error) {
      console.error("Error hiding order:", error);
      throw error;
    }
  };

  const showOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ is_hidden: false })
        .eq("id", orderId);

      if (error) throw error;

      // Refresh orders to update the UI
      await fetchOrders();
    } catch (error) {
      console.error("Error showing order:", error);
      throw error;
    }
  };

  return {
    stocks,
    customers,
    orders,
    loading,
    createOrder,
    createCustomer,
    createOrUpdateStock,
    deleteOrder,
    deleteStock,
    updateOrder,
    hideOrder,
    showOrder,
    fetchStocks,
    fetchCustomers,
    fetchOrders,
  };
};
