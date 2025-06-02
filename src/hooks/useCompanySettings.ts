import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
export interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string;
  company_gstin: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanySettingsForm {
  company_name: string;
  company_address: string;
  company_gstin: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
}

export const useCompanySettings = () => {
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching company settings:", error);
        setError("Failed to fetch company settings");
        return;
      }

      setCompanySettings(data);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateCompanySettings = async (
    settings: CompanySettingsForm
  ): Promise<CompanySettings> => {
    try {
      setError(null);

      if (!companySettings) {
        throw new Error("No existing company settings found");
      }

      const { data, error } = await supabase
        .from("company_settings")
        .update({
          company_name: settings.company_name,
          company_address: settings.company_address,
          company_gstin: settings.company_gstin,
          company_phone: settings.company_phone || null,
          company_email: settings.company_email || null,
          company_website: settings.company_website || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companySettings.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating company settings:", error);
        throw new Error("Failed to update company settings");
      }

      setCompanySettings(data);
      return data;
    } catch (err) {
      console.error("Error updating company settings:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update company settings";
      setError(errorMessage);
      throw err;
    }
  };

  const createCompanySettings = async (
    settings: CompanySettingsForm
  ): Promise<CompanySettings> => {
    try {
      setError(null);

      // First, deactivate any existing active settings
      await supabase
        .from("company_settings")
        .update({ is_active: false })
        .eq("is_active", true);

      // Create new settings
      const { data, error } = await supabase
        .from("company_settings")
        .insert({
          company_name: settings.company_name,
          company_address: settings.company_address,
          company_gstin: settings.company_gstin,
          company_phone: settings.company_phone || null,
          company_email: settings.company_email || null,
          company_website: settings.company_website || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating company settings:", error);
        throw new Error("Failed to create company settings");
      }

      setCompanySettings(data);
      return data;
    } catch (err) {
      console.error("Error creating company settings:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create company settings";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  return {
    companySettings,
    loading,
    error,
    fetchCompanySettings,
    updateCompanySettings,
    createCompanySettings,
  };
};
