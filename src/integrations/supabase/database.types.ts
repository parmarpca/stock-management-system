export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          authorized_dealers_label: string | null
          company_address: string
          company_email: string | null
          company_gstin: string
          company_name: string
          company_phone: string | null
          company_website: string | null
          created_at: string | null
          dealer_logo_1: string | null
          dealer_logo_2: string | null
          id: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          authorized_dealers_label?: string | null
          company_address: string
          company_email?: string | null
          company_gstin: string
          company_name: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          dealer_logo_1?: string | null
          dealer_logo_2?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          authorized_dealers_label?: string | null
          company_address?: string
          company_email?: string | null
          company_gstin?: string
          company_name?: string
          company_phone?: string | null
          company_website?: string | null
          created_at?: string | null
          dealer_logo_1?: string | null
          dealer_logo_2?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          gstin_number: string | null
          id: string
          mobile_number: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          gstin_number?: string | null
          id?: string
          mobile_number?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          gstin_number?: string | null
          id?: string
          mobile_number?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      "keep-alive": {
        Row: {
          id: number
          name: string | null
          random: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          random?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          random?: string | null
        }
        Relationships: []
      }
      order_additional_costs: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          label: string
          order_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          label: string
          order_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          label?: string
          order_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_additional_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          is_from_stock_table: boolean
          manual_net_weight: number | null
          order_id: string
          pieces_used: number
          price_per_piece: number
          rate_type: string
          stock_code: string | null
          stock_id: string
          stock_length: string | null
          stock_name: string | null
          subtotal: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_stock_table?: boolean
          manual_net_weight?: number | null
          order_id: string
          pieces_used: number
          price_per_piece?: number
          rate_type?: string
          stock_code?: string | null
          stock_id: string
          stock_length?: string | null
          stock_name?: string | null
          subtotal?: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_stock_table?: boolean
          manual_net_weight?: number | null
          order_id?: string
          pieces_used?: number
          price_per_piece?: number
          rate_type?: string
          stock_code?: string | null
          stock_id?: string
          stock_length?: string | null
          stock_name?: string | null
          subtotal?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_name: string | null
          color_code: string | null
          created_at: string | null
          customer_gstin: string | null
          customer_id: string
          gst_amount: number
          gst_enabled: boolean
          gst_percentage: number | null
          gst_type: string | null
          id: string
          is_hidden: boolean
          order_date: string
          order_number: number
          raw_total: number
          rounding_adjustment: number
          show_unit_price: boolean
          site_name: string | null
          subtotal: number
          total_amount: number
          updated_at: string | null
          vehicle_number: string | null
        }
        Insert: {
          agent_name?: string | null
          color_code?: string | null
          created_at?: string | null
          customer_gstin?: string | null
          customer_id: string
          gst_amount?: number
          gst_enabled?: boolean
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          is_hidden?: boolean
          order_date?: string
          order_number?: number
          raw_total?: number
          rounding_adjustment?: number
          show_unit_price?: boolean
          site_name?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Update: {
          agent_name?: string | null
          color_code?: string | null
          created_at?: string | null
          customer_gstin?: string | null
          customer_id?: string
          gst_amount?: number
          gst_enabled?: boolean
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          is_hidden?: boolean
          order_date?: string
          order_number?: number
          raw_total?: number
          rounding_adjustment?: number
          show_unit_price?: boolean
          site_name?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_additional_costs: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          label: string
          quotation_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          label: string
          quotation_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          label?: string
          quotation_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_additional_costs_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string | null
          id: string
          is_from_stock_table: boolean
          length: string
          manual_net_weight: number | null
          pieces: number
          price_per_piece: number
          quotation_id: string
          rate_type: string
          stock_code: string
          stock_id: string | null
          stock_name: string
          subtotal: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_from_stock_table?: boolean
          length: string
          manual_net_weight?: number | null
          pieces: number
          price_per_piece: number
          quotation_id: string
          rate_type?: string
          stock_code: string
          stock_id?: string | null
          stock_name: string
          subtotal?: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_from_stock_table?: boolean
          length?: string
          manual_net_weight?: number | null
          pieces?: number
          price_per_piece?: number
          quotation_id?: string
          rate_type?: string
          stock_code?: string
          stock_id?: string | null
          stock_name?: string
          subtotal?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          additional_costs_total: number
          created_at: string | null
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string
          gst_amount: number
          gst_enabled: boolean
          gst_percentage: number | null
          gst_type: string | null
          id: string
          quotation_date: string
          quotation_number: number
          raw_total: number
          rounding_adjustment: number
          show_unit_price: boolean
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          additional_costs_total?: number
          created_at?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name: string
          gst_amount?: number
          gst_enabled?: boolean
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          quotation_date?: string
          quotation_number?: number
          raw_total?: number
          rounding_adjustment?: number
          show_unit_price?: boolean
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          additional_costs_total?: number
          created_at?: string | null
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string
          gst_amount?: number
          gst_enabled?: boolean
          gst_percentage?: number | null
          gst_type?: string | null
          id?: string
          quotation_date?: string
          quotation_number?: number
          raw_total?: number
          rounding_adjustment?: number
          show_unit_price?: boolean
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          stock_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          stock_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          stock_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          code: string
          created_at: string | null
          id: string
          length: string
          name: string
          quantity: number
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          length: string
          name: string
          quantity?: number
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          length?: string
          name?: string
          quantity?: number
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_order_totals: { Args: { order_uuid: string }; Returns: undefined }
      update_quotation_totals: {
        Args: { quotation_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
