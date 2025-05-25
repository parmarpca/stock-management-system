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
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  color_code?: string;
  customer_name?: string;
  order_items?: OrderItem[];
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

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers(name),
          order_items(
            id,
            stock_id,
            pieces_used,
            stocks(name)
          )
        `
        )
        .order("order_date", { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders =
        ordersData?.map((order) => ({
          ...order,
          customer_name: order.customers?.name,
          order_items: order.order_items?.map((item: any) => ({
            ...item,
            stock_name: item.stocks?.name,
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
    items: Omit<OrderItem, "id" | "order_id">[]
  ) => {
    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{ customer_id: customerId }])
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
      await Promise.all([fetchStocks(), fetchCustomers(), fetchOrders()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    stocks,
    customers,
    orders,
    loading,
    createOrder,
    createCustomer,
    createOrUpdateStock,
    fetchStocks,
    fetchCustomers,
    fetchOrders,
  };
};
