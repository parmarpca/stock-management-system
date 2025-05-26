import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Stock {
  id: string;
  name: string;
  code: string;
  length: "16ft" | "12ft";
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  stock_id: string;
  pieces_used: number;
  stock_name?: string;
  stock_code?: string;
  stock_length?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  color_code?: string;
  customer_name?: string;
  order_items?: OrderItem[];
  is_hidden?: boolean;
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
          customers(name),
          order_items(
            id,
            stock_id,
            pieces_used,
            stocks(name, code, length)
          )
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
        ordersData?.map((order: any) => ({
          ...order,
          customer_name: order.customers?.name,
          order_items: order.order_items?.map((item: any) => ({
            ...item,
            stock_name: item.stocks?.name,
            stock_code: item.stocks?.code,
            stock_length: item.stocks?.length,
          })),
        })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const createCustomer = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name }])
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
    length: "16ft" | "12ft";
    quantity: number;
  }) => {
    try {
      // Check if stock with same code exists
      const { data: existingStock, error: checkError } = await supabase
        .from("stocks")
        .select("*")
        .eq("code", stockData.code)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingStock) {
        // Update existing stock quantity
        const { data, error } = await supabase
          .from("stocks")
          .update({
            quantity: existingStock.quantity + stockData.quantity,
            name: stockData.name,
            length: stockData.length,
          })
          .eq("id", existingStock.id)
          .select()
          .single();

        if (error) throw error;
        await fetchStocks();
        return data;
      } else {
        // Create new stock
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
    colorCode?: string
  ) => {
    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{ customer_id: customerId, color_code: colorCode }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        stock_id: item.stock_id,
        pieces_used: item.pieces_used,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock quantities
      for (const item of items) {
        // First get current quantity
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity - item.pieces_used;

        const { error: updateError } = await supabase
          .from("stocks")
          .update({ quantity: newQuantity })
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
    colorCode?: string
  ) => {
    try {
      // First get existing order items to restore stock quantities
      const { data: existingItems, error: fetchError } = await supabase
        .from("order_items")
        .select("stock_id, pieces_used")
        .eq("order_id", orderId);

      if (fetchError) throw fetchError;

      // Restore stock quantities from existing items
      for (const item of existingItems || []) {
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
        .update({ customer_id: customerId, color_code: colorCode })
        .eq("id", orderId);

      if (orderError) throw orderError;

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
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock quantities for new items
      for (const item of items) {
        const { data: stockData, error: stockError } = await supabase
          .from("stocks")
          .select("quantity")
          .eq("id", item.stock_id)
          .single();

        if (stockError) throw stockError;

        const newQuantity = stockData.quantity - item.pieces_used;

        const { error: updateError } = await supabase
          .from("stocks")
          .update({ quantity: newQuantity })
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
