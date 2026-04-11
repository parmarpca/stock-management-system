import { stockLength } from "@/constants/config";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      company_settings: {
        Row: {
          id: string;
          company_name: string;
          company_address: string;
          company_gstin: string;
          company_phone: string | null;
          company_email: string | null;
          company_website: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          company_address: string;
          company_gstin: string;
          company_phone?: string | null;
          company_email?: string | null;
          company_website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          company_address?: string;
          company_gstin?: string;
          company_phone?: string | null;
          company_email?: string | null;
          company_website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          mobile_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mobile_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stocks: {
        Row: {
          id: string;
          name: string;
          code: string;
          length: stockLength;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          length: stockLength;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          length?: stockLength;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          order_date: string;
          color_code: string | null;
          is_hidden: boolean;
          vehicle_number: string | null;
          agent_name: string | null;
          customer_address: string | null;
          customer_gstin: string | null;
          subtotal: number;
          gst_enabled: boolean;
          gst_type: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage: number;
          gst_amount: number;
          total_amount: number;
          raw_total: number;
          rounding_adjustment: number;
          show_unit_price: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_date?: string;
          color_code?: string | null;
          is_hidden?: boolean;
          vehicle_number?: string | null;
          agent_name?: string | null;
          customer_address?: string | null;
          customer_gstin?: string | null;
          subtotal?: number;
          gst_enabled?: boolean;
          gst_type?: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage?: number;
          gst_amount?: number;
          total_amount?: number;
          raw_total?: number;
          rounding_adjustment?: number;
          show_unit_price?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_date?: string;
          color_code?: string | null;
          is_hidden?: boolean;
          vehicle_number?: string | null;
          agent_name?: string | null;
          customer_address?: string | null;
          customer_gstin?: string | null;
          subtotal?: number;
          gst_enabled?: boolean;
          gst_type?: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage?: number;
          gst_amount?: number;
          total_amount?: number;
          raw_total?: number;
          rounding_adjustment?: number;
          show_unit_price?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      order_additional_costs: {
        Row: {
          id: string;
          order_id: string;
          label: string;
          type: "add" | "discount";
          amount: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          label: string;
          type: "add" | "discount";
          amount: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          label?: string;
          type?: "add" | "discount";
          amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_additional_costs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          stock_id: string;
          pieces_used: number;
          price_per_piece: number;
          subtotal: number;
          weight: number | null;
          stock_name: string | null;
          stock_code: string | null;
          stock_length: string | null;
          is_from_stock_table: boolean;
          rate_type: "per_kg" | "per_pc";
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          stock_id: string;
          pieces_used: number;
          price_per_piece?: number;
          subtotal?: number;
          weight?: number | null;
          stock_name?: string | null;
          stock_code?: string | null;
          stock_length?: string | null;
          is_from_stock_table?: boolean;
          rate_type?: "per_kg" | "per_pc";
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          stock_id?: string;
          pieces_used?: number;
          price_per_piece?: number;
          subtotal?: number;
          weight?: number | null;
          stock_name?: string | null;
          stock_code?: string | null;
          stock_length?: string | null;
          is_from_stock_table?: boolean;
          rate_type?: "per_kg" | "per_pc";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_history: {
        Row: {
          id: string;
          stock_id: string;
          type: "ADD" | "SELL" | "ADJUST";
          quantity_change: number;
          quantity_before: number;
          quantity_after: number;
          reference_id: string | null;
          reference_type: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_id: string;
          type: "ADD" | "SELL" | "ADJUST";
          quantity_change: number;
          quantity_before: number;
          quantity_after: number;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stock_id?: string;
          type?: "ADD" | "SELL" | "ADJUST";
          quantity_change?: number;
          quantity_before?: number;
          quantity_after?: number;
          reference_id?: string | null;
          reference_type?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_history_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          }
        ];
      };
      quotations: {
        Row: {
          id: string;
          quotation_number: number;
          customer_name: string;
          quotation_date: string;
          subtotal: number;
          additional_costs_total: number;
          gst_enabled: boolean;
          gst_type: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage: number;
          gst_amount: number;
          total_amount: number;
          show_unit_price: boolean;
          customer_address: string | null;
          customer_gstin: string | null;
          raw_total: number;
          rounding_adjustment: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quotation_number?: number;
          customer_name: string;
          quotation_date?: string;
          subtotal?: number;
          additional_costs_total?: number;
          gst_enabled?: boolean;
          gst_type?: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage?: number;
          gst_amount?: number;
          total_amount?: number;
          show_unit_price?: boolean;
          customer_address?: string | null;
          customer_gstin?: string | null;
          raw_total?: number;
          rounding_adjustment?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quotation_number?: number;
          customer_name?: string;
          quotation_date?: string;
          subtotal?: number;
          additional_costs_total?: number;
          gst_enabled?: boolean;
          gst_type?: "CGST_SGST" | "IGST" | "UTGST" | null;
          gst_percentage?: number;
          gst_amount?: number;
          total_amount?: number;
          show_unit_price?: boolean;
          customer_address?: string | null;
          customer_gstin?: string | null;
          raw_total?: number;
          rounding_adjustment?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          stock_name: string;
          stock_code: string;
          length: string;
          pieces: number;
          price_per_piece: number;
          subtotal: number;
          is_from_stock_table: boolean;
          rate_type: "per_kg" | "per_pc";
          stock_id: string | null;
          weight: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          stock_name: string;
          stock_code: string;
          length: string;
          pieces: number;
          price_per_piece: number;
          subtotal?: number;
          is_from_stock_table?: boolean;
          rate_type?: "per_kg" | "per_pc";
          stock_id?: string | null;
          weight?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quotation_id?: string;
          stock_name?: string;
          stock_code?: string;
          length?: string;
          pieces?: number;
          price_per_piece?: number;
          subtotal?: number;
          is_from_stock_table?: boolean;
          rate_type?: "per_kg" | "per_pc";
          stock_id?: string | null;
          weight?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey";
            columns: ["quotation_id"];
            isOneToOne: false;
            referencedRelation: "quotations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotation_items_stock_id_fkey";
            columns: ["stock_id"];
            isOneToOne: false;
            referencedRelation: "stocks";
            referencedColumns: ["id"];
          }
        ];
      };
      quotation_additional_costs: {
        Row: {
          id: string;
          quotation_id: string;
          label: string;
          type: "add" | "discount";
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          label: string;
          type: "add" | "discount";
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quotation_id?: string;
          label?: string;
          type?: "add" | "discount";
          amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotation_additional_costs_quotation_id_fkey";
            columns: ["quotation_id"];
            isOneToOne: false;
            referencedRelation: "quotations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
  ? R
  : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
