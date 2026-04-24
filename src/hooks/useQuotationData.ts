import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stockLength } from "@/constants/config";
import { useAuth } from "@/contexts/AuthContext";

export interface QuotationItem {
  id: string;
  quotation_id: string;
  stock_name: string;
  stock_code: string;
  length: stockLength;
  pieces: number;
  price_per_piece: number;
  subtotal: number;
  is_from_stock_table: boolean;
  rate_type: "per_kg" | "per_pc";
  stock_id?: string;
  weight?: number; // Weight in kg
  manual_net_weight?: number;
}

export interface QuotationAdditionalCost {
  id: string;
  quotation_id: string;
  label: string;
  type: "add" | "discount";
  amount: number;
}

export interface Quotation {
  id: string;
  quotation_number: number;
  customer_name: string;
  customer_address?: string;
  customer_gstin?: string;
  quotation_date: string;
  subtotal: number;
  additional_costs_total: number;
  gst_enabled: boolean;
  gst_type?: "CGST_SGST" | "IGST" | "UTGST";
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;
  raw_total: number;
  rounding_adjustment: number;
  show_unit_price: boolean;
  created_at: string;
  updated_at: string;
  quotation_items?: QuotationItem[];
  quotation_additional_costs?: QuotationAdditionalCost[];
}

export interface QuotationItemForm {
  stock_name: string;
  stock_code: string;
  length: stockLength;
  pieces: number;
  price_per_piece: number;
  is_from_stock_table: boolean;
  rate_type: "per_kg" | "per_pc";
  stock_id?: string;
  weight?: number; // Weight in kg
  manual_net_weight?: number;
}

export interface QuotationAdditionalCostForm {
  label: string;
  type: "add" | "discount";
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  address?: string;
  gstin_number?: string;
  mobile_number?: string;
  created_at: string;
}

export const useQuotationData = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchCustomers = async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      const customersList = data || [];
      setCustomers(customersList);
      return customersList;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  };

  const findOrCreateCustomer = async (
    customerName: string,
    customerAddress?: string,
    customerGstin?: string
  ): Promise<{ id: string; address?: string; gstin_number?: string; mobile_number?: string | null }> => {
    try {
      // First, try to find existing customer (cast to any for now until migrations are applied)
      const { data: existingCustomers, error: searchError } = await supabase

        .from("customers")
        .select("id, name, address, gstin_number, mobile_number")
        .ilike("name", customerName.trim());

      if (searchError) throw searchError;

      let customer: { id: string; address?: string; gstin_number?: string; mobile_number?: string | null };
      // If customer exists, update their details if provided
      if (existingCustomers && existingCustomers.length > 0) {
        customer = existingCustomers[0];

        // Update customer details if new information is provided
        if (customerAddress || customerGstin) {
          const updateData: { address?: string; gstin_number?: string } = {};
          if (customerAddress) updateData.address = customerAddress;
          if (customerGstin) updateData.gstin_number = customerGstin;

          const { data: updatedCustomer, error: updateError } = await supabase

            .from("customers")
            .update(updateData)
            .eq("id", customer.id)
            .select("id, address, gstin_number, mobile_number")
            .single();

          if (updateError) throw updateError;
          customer = {
            id: customer.id,
            address: updatedCustomer?.address ?? undefined,
            gstin_number: updatedCustomer?.gstin_number ?? undefined,
            mobile_number: updatedCustomer?.mobile_number,
          };
        }
      } else {
        // Create new customer
        const insertData: { name: string; address?: string; gstin_number?: string } = { name: customerName.trim() };
        if (customerAddress) insertData.address = customerAddress;
        if (customerGstin) insertData.gstin_number = customerGstin;
        // Optionally pass mobileNumber if an argument exists for it, here we assume it's omitted in Quotation create unless we update the params, but the interface holds it at least.

        const { data: newCustomer, error: createError } = await supabase

          .from("customers")
          .insert([insertData])
          .select("id, address, gstin_number, mobile_number")
          .single();

        if (createError) throw createError;
        customer = {
          id: newCustomer.id,
          address: newCustomer.address ?? undefined,
          gstin_number: newCustomer.gstin_number ?? undefined,
          mobile_number: newCustomer.mobile_number
        };
      }

      // Refresh customers list
      await fetchCustomers();

      return customer;
    } catch (error) {
      console.error("Error finding/creating customer:", error);
      throw error;
    }
  };

  const fetchQuotations = async (
    showTodayOnly: boolean = true
  ): Promise<void> => {
    try {
      let query = supabase.from("quotations").select(`
          *,
          quotation_items(*),
          quotation_additional_costs(*)
        `);

      if (!isAdmin && user?.id) {
        query = query.eq("user_id", user.id);
      }

      if (showTodayOnly) {
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("quotation_date", today);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
    }
  };

  const updateStockWeight = async (
    stockId: string,
    weight: number
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("stocks")
        .update({ weight })
        .eq("id", stockId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating stock weight:", error);
      // Don't throw error to prevent quotation creation failure
    }
  };

  const createQuotation = async (
    customerName: string,
    customerAddress: string,
    customerGstin: string,
    quotationDate: string,
    items: QuotationItemForm[],
    additionalCosts: QuotationAdditionalCostForm[],
    gstEnabled: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage: number = 18,
    showUnitPrice: boolean = true
  ): Promise<Quotation> => {
    try {
      // Find or create customer
      const customer = await findOrCreateCustomer(
        customerName,
        customerAddress,
        customerGstin
      );

      // Create the quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert([
          {
            customer_name: customerName.trim(),
            customer_address: customerAddress,
            customer_gstin: customerGstin,
            quotation_date: quotationDate,
            gst_enabled: gstEnabled,
            gst_type: gstType,
            gst_percentage: gstPercentage,
            show_unit_price: showUnitPrice,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Add quotation items and update stock weights if needed
      if (items.length > 0) {
        const quotationItems = items.map((item) => ({
          quotation_id: quotation.id,
          stock_name: item.stock_name,
          stock_code: item.stock_code,
          length: item.length,
          pieces: item.pieces,
          price_per_piece: item.price_per_piece,
          is_from_stock_table: item.is_from_stock_table,
          rate_type: item.rate_type,
          stock_id: item.stock_id,
          weight: item.weight,
          manual_net_weight: item.manual_net_weight,
        }));

        const { error: itemsError } = await supabase
          .from("quotation_items")
          .insert(quotationItems);

        if (itemsError) throw itemsError;

        // Update stock weights if weight is provided for items from stock table
        for (const item of items) {
          if (item.is_from_stock_table && item.stock_id && item.weight) {
            await updateStockWeight(item.stock_id, item.weight);
          }
        }
      }

      // Add additional costs
      if (additionalCosts.length > 0) {
        const additionalCostsData = additionalCosts.map((cost) => ({
          quotation_id: quotation.id,
          label: cost.label,
          type: cost.type,
          amount: cost.amount,
        }));

        const { error: costsError } = await supabase
          .from("quotation_additional_costs")
          .insert(additionalCostsData);

        if (costsError) throw costsError;
      }

      // Calculate totals using the database function
      const { error: calcError } = await supabase.rpc(
        "update_quotation_totals",
        {
          quotation_uuid: quotation.id,
        }
      );

      if (calcError) throw calcError;

      await fetchQuotations();
      return quotation;
    } catch (error) {
      console.error("Error creating quotation:", error);
      throw error;
    }
  };

  const updateQuotation = async (
    quotationId: string,
    customerName: string,
    customerAddress: string,
    customerGstin: string,
    quotationDate: string,
    items: QuotationItemForm[],
    additionalCosts: QuotationAdditionalCostForm[],
    gstEnabled: boolean,
    gstType?: "CGST_SGST" | "IGST" | "UTGST",
    gstPercentage: number = 18,
    showUnitPrice: boolean = true
  ): Promise<void> => {
    try {
      // Find or create customer
      await findOrCreateCustomer(customerName, customerAddress, customerGstin);

      // Update the quotation
      const { error: quotationError } = await supabase
        .from("quotations")
        .update({
          customer_name: customerName.trim(),
          customer_address: customerAddress,
          customer_gstin: customerGstin,
          quotation_date: quotationDate,
          gst_enabled: gstEnabled,
          gst_type: gstType,
          gst_percentage: gstPercentage,
          show_unit_price: showUnitPrice,
        })
        .eq("id", quotationId);

      if (quotationError) throw quotationError;

      // Delete existing items and additional costs
      await supabase
        .from("quotation_items")
        .delete()
        .eq("quotation_id", quotationId);

      await supabase
        .from("quotation_additional_costs")
        .delete()
        .eq("quotation_id", quotationId);

      // Add new quotation items and update stock weights if needed
      if (items.length > 0) {
        const quotationItems = items.map((item) => ({
          quotation_id: quotationId,
          stock_name: item.stock_name,
          stock_code: item.stock_code,
          length: item.length,
          pieces: item.pieces,
          price_per_piece: item.price_per_piece,
          is_from_stock_table: item.is_from_stock_table,
          rate_type: item.rate_type,
          stock_id: item.stock_id,
          weight: item.weight,
          manual_net_weight: item.manual_net_weight,
        }));

        const { error: itemsError } = await supabase
          .from("quotation_items")
          .insert(quotationItems);

        if (itemsError) throw itemsError;

        // Update stock weights if weight is provided for items from stock table
        for (const item of items) {
          if (item.is_from_stock_table && item.stock_id && item.weight) {
            await updateStockWeight(item.stock_id, item.weight);
          }
        }
      }

      // Add new additional costs
      if (additionalCosts.length > 0) {
        const additionalCostsData = additionalCosts.map((cost) => ({
          quotation_id: quotationId,
          label: cost.label,
          type: cost.type,
          amount: cost.amount,
        }));

        const { error: costsError } = await supabase
          .from("quotation_additional_costs")
          .insert(additionalCostsData);

        if (costsError) throw costsError;
      }

      // Calculate totals using the database function
      const { error: calcError } = await supabase.rpc(
        "update_quotation_totals",
        {
          quotation_uuid: quotationId,
        }
      );

      if (calcError) throw calcError;

      await fetchQuotations();
    } catch (error) {
      console.error("Error updating quotation:", error);
      throw error;
    }
  };

  const deleteQuotation = async (quotationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationId);

      if (error) throw error;
      await fetchQuotations();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCustomers(),
        fetchQuotations(true), // Default to today's quotations
      ]);
      setLoading(false);
    };

    loadData();
  }, [user?.id, isAdmin]);

  return {
    quotations,
    customers,
    loading,
    fetchQuotations,
    fetchCustomers,
    createQuotation,
    updateQuotation,
    deleteQuotation,
  };
};
