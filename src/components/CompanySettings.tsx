import { useState, useEffect } from "react";
import { Building2, Save, Loader2, Phone, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompanySettings,
  CompanySettingsForm,
} from "@/hooks/useCompanySettings";
import { SuccessDialog } from "@/components/ui/success-dialog";

const CompanySettings = () => {
  const {
    companySettings,
    loading,
    error,
    updateCompanySettings,
    createCompanySettings,
  } = useCompanySettings();

  const [formData, setFormData] = useState<CompanySettingsForm>({
    company_name: "",
    company_address: "",
    company_gstin: "",
    company_phone: "",
    company_email: "",
    company_website: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (companySettings) {
      setFormData({
        company_name: companySettings.company_name,
        company_address: companySettings.company_address,
        company_gstin: companySettings.company_gstin,
        company_phone: companySettings.company_phone || "",
        company_email: companySettings.company_email || "",
        company_website: companySettings.company_website || "",
      });
    }
  }, [companySettings]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      errors.company_name = "Company name is required";
    }

    if (!formData.company_address.trim()) {
      errors.company_address = "Company address is required";
    }

    if (!formData.company_gstin.trim()) {
      errors.company_gstin = "GSTIN is required";
    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.company_gstin
      )
    ) {
      errors.company_gstin = "Invalid GSTIN format";
    }

    if (
      formData.company_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)
    ) {
      errors.company_email = "Invalid email format";
    }

    if (
      formData.company_phone &&
      !/^[+]?[0-9\s\-()]{10,15}$/.test(formData.company_phone)
    ) {
      errors.company_phone = "Invalid phone number format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof CompanySettingsForm,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      if (companySettings) {
        await updateCompanySettings(formData);
      } else {
        await createCompanySettings(formData);
      }
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error saving company settings:", error);
      alert("Failed to save company settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading company settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
        <p className="text-muted-foreground">
          Manage your company information for quotations and documents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  handleInputChange("company_name", e.target.value)
                }
                placeholder="Enter company name"
                className={formErrors.company_name ? "border-red-500" : ""}
              />
              {formErrors.company_name && (
                <p className="text-sm text-red-500">
                  {formErrors.company_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_gstin">
                GSTIN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_gstin"
                value={formData.company_gstin}
                onChange={(e) =>
                  handleInputChange(
                    "company_gstin",
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={formErrors.company_gstin ? "border-red-500" : ""}
              />
              {formErrors.company_gstin && (
                <p className="text-sm text-red-500">
                  {formErrors.company_gstin}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="company_address"
              value={formData.company_address}
              onChange={(e) =>
                handleInputChange("company_address", e.target.value)
              }
              placeholder="Enter complete company address"
              rows={3}
              className={formErrors.company_address ? "border-red-500" : ""}
            />
            {formErrors.company_address && (
              <p className="text-sm text-red-500">
                {formErrors.company_address}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_phone" className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                Phone Number
              </Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) =>
                  handleInputChange("company_phone", e.target.value)
                }
                placeholder="+91 9876543210"
                className={formErrors.company_phone ? "border-red-500" : ""}
              />
              {formErrors.company_phone && (
                <p className="text-sm text-red-500">
                  {formErrors.company_phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email" className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                Email Address
              </Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) =>
                  handleInputChange("company_email", e.target.value)
                }
                placeholder="info@company.com"
                className={formErrors.company_email ? "border-red-500" : ""}
              />
              {formErrors.company_email && (
                <p className="text-sm text-red-500">
                  {formErrors.company_email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_website" className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Website
              </Label>
              <Input
                id="company_website"
                value={formData.company_website}
                onChange={(e) =>
                  handleInputChange("company_website", e.target.value)
                }
                placeholder="https://www.company.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (companySettings) {
                  setFormData({
                    company_name: companySettings.company_name,
                    company_address: companySettings.company_address,
                    company_gstin: companySettings.company_gstin,
                    company_phone: companySettings.company_phone || "",
                    company_email: companySettings.company_email || "",
                    company_website: companySettings.company_website || "",
                  });
                }
                setFormErrors({});
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Settings Saved Successfully!"
        message="Company settings have been updated successfully."
      />
    </div>
  );
};

export default CompanySettings;
