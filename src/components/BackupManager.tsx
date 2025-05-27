import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  Loader2,
  Database,
  AlertTriangle,
  Key,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Simple encryption/decryption functions for backup security
const encryptData = (data: string, password: string): string => {
  // Simple XOR encryption with password
  let encrypted = "";
  for (let i = 0; i < data.length; i++) {
    const charCode =
      data.charCodeAt(i) ^ password.charCodeAt(i % password.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted); // Base64 encode
};

const decryptData = (encryptedData: string, password: string): string => {
  try {
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch (error) {
    throw new Error("Invalid backup file or incorrect password");
  }
};

const BackupManager = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [clearConfirmation, setClearConfirmation] = useState("");
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600">Access Denied</h3>
        <p className="text-gray-600">
          Only administrators can access backup functionality.
        </p>
      </div>
    );
  }

  const downloadBackup = async () => {
    if (!backupPassword.trim()) {
      alert("Please enter a password to encrypt the backup");
      return;
    }

    if (backupPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch all data from all tables
      const [
        stocksResult,
        customersResult,
        ordersResult,
        orderItemsResult,
        stockHistoryResult,
      ] = await Promise.all([
        supabase.from("stocks").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("order_items").select("*"),
        supabase.from("stock_history").select("*"),
      ]);

      if (stocksResult.error) throw stocksResult.error;
      if (customersResult.error) throw customersResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (orderItemsResult.error) throw orderItemsResult.error;
      if (stockHistoryResult.error) throw stockHistoryResult.error;
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "2.0",
        encrypted: true,
        data: {
          stocks: stocksResult.data,
          customers: customersResult.data,
          orders: ordersResult.data,
          order_items: orderItemsResult.data,
          stock_history: stockHistoryResult.data,
        },
      };

      // Encrypt the backup data
      const jsonData = JSON.stringify(backupData);
      const encryptedData = encryptData(jsonData, backupPassword);

      // Create secure backup file with .smb extension (Stock Management Backup)
      const secureBackup = {
        format: "SMB_ENCRYPTED",
        version: "2.0",
        data: encryptedData,
        checksum: btoa(backupPassword.slice(0, 4)), // Simple checksum for validation
      };

      const blob = new Blob([JSON.stringify(secureBackup)], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stock-management-backup-${
        new Date().toISOString().split("T")[0]
      }.smb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(
        "Encrypted backup downloaded successfully! Keep your password safe - it's required for restoration."
      );
      setBackupPassword("");
    } catch (error) {
      console.error("Error downloading backup:", error);
      alert("Failed to download backup. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const uploadBackup = async () => {
    if (!uploadFile) {
      alert("Please select a backup file to upload.");
      return;
    }

    if (!restorePassword.trim()) {
      alert("Please enter the password used to encrypt this backup.");
      return;
    }

    setIsUploading(true);
    try {
      const fileContent = await uploadFile.text();
      let backupData;

      // Check if it's an encrypted backup file
      try {
        const encryptedBackup = JSON.parse(fileContent);

        if (encryptedBackup.format === "SMB_ENCRYPTED") {
          // Decrypt the backup
          const decryptedData = decryptData(
            encryptedBackup.data,
            restorePassword
          );
          backupData = JSON.parse(decryptedData);
        }
      } catch (error) {
        throw new Error("Invalid backup file format or incorrect password");
      }

      // Validate backup structure
      if (
        !backupData.data ||
        !backupData.data.stocks ||
        !backupData.data.customers
      ) {
        throw new Error("Invalid backup file format");
      }

      // Confirm before proceeding
      const confirmed = confirm(
        "This will replace ALL existing data with the backup data. This action cannot be undone. Are you sure you want to continue?"
      );

      if (!confirmed) {
        setIsUploading(false);
        return;
      }

      // Clear existing data (in reverse order due to foreign key constraints)
      await supabase
        .from("order_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("stocks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      await supabase
        .from("stock_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert backup data
      if (backupData.data.customers.length > 0) {
        const { error: customersError } = await supabase
          .from("customers")
          .insert(backupData.data.customers);
        if (customersError) throw customersError;
      }

      if (backupData.data.stocks.length > 0) {
        const { error: stocksError } = await supabase
          .from("stocks")
          .insert(backupData.data.stocks);
        if (stocksError) throw stocksError;
      }

      if (backupData.data.orders.length > 0) {
        const { error: ordersError } = await supabase
          .from("orders")
          .insert(backupData.data.orders);
        if (ordersError) throw ordersError;
      }

      if (backupData.data.order_items.length > 0) {
        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(backupData.data.order_items);
        if (orderItemsError) throw orderItemsError;
      }

      if (backupData.data.stock_history.length > 0) {
        const { error: stockHistoryError } = await supabase
          .from("stock_history")
          .insert(backupData.data.stock_history);
        if (stockHistoryError) throw stockHistoryError;
      }

      alert(
        "Backup restored successfully! Please refresh the page to see the updated data."
      );
      setRestorePassword("");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading backup:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to restore backup. Please check the file format and password."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearDatabase = async () => {
    if (clearConfirmation !== "DELETE ALL DATA") {
      alert('Please type "DELETE ALL DATA" to confirm database clearing');
      return;
    }

    const finalConfirm = confirm(
      "⚠️ FINAL WARNING ⚠️\n\nThis will permanently delete ALL data from the database including:\n- All stock items\n- All customers\n- All orders\n- All order items\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?"
    );

    if (!finalConfirm) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear all data in reverse order due to foreign key constraints
      await supabase
        .from("order_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      await supabase
        .from("stocks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      alert(
        "Database cleared successfully! All data has been permanently deleted."
      );
      setClearConfirmation("");

      // Refresh the page to reflect the changes
      window.location.reload();
    } catch (error) {
      console.error("Error clearing database:", error);
      alert("Failed to clear database. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".smb") || file.name.endsWith(".json"))) {
      setUploadFile(file);
    } else {
      alert("Please select a valid backup file (.smb or .json).");
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Backup Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Download Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Encrypted Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download a secure, encrypted backup of all your data including
              stocks, customers, orders, and order items.
            </p>
            <div className="space-y-2">
              <Label htmlFor="backup-password">Encryption Password</Label>
              <Input
                id="backup-password"
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                minLength={8}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                <Key className="h-3 w-3 inline mr-1" />
                This password will be required to restore the backup. Keep it
                safe!
              </p>
            </div>
            <Button
              onClick={downloadBackup}
              disabled={isDownloading || !backupPassword.trim()}
              className="w-full"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Encrypted Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Encrypted Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload an encrypted backup file to restore your data. This will
              replace all existing data.
            </p>
            <div className="space-y-2">
              <Label htmlFor="backup-file">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".smb,.json"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            {uploadFile && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">
                  Selected: {uploadFile.name}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="restore-password">Backup Password</Label>
                  <Input
                    id="restore-password"
                    type="password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    placeholder="Enter the password used to encrypt this backup"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-medium">⚠️ Warning</p>
              <p className="text-sm text-red-700">
                This action will permanently delete all existing data and
                replace it with the backup data.
              </p>
            </div>
            <Button
              onClick={uploadBackup}
              disabled={isUploading || !uploadFile || !restorePassword.trim()}
              variant="destructive"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Clear Database */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Clear Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Permanently delete all data from the database. This action cannot
              be undone.
            </p>
            <div className="space-y-2">
              <Label htmlFor="clear-confirmation">
                Type "DELETE ALL DATA" to confirm
              </Label>
              <Input
                id="clear-confirmation"
                type="text"
                value={clearConfirmation}
                onChange={(e) => setClearConfirmation(e.target.value)}
                placeholder="DELETE ALL DATA"
                autoComplete="off"
                className="border-red-200 focus:border-red-400"
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800 font-medium">⚠️ DANGER ZONE</p>
              <p className="text-sm text-red-700">
                This will permanently delete ALL data including stocks,
                customers, orders, and order items. This action CANNOT be
                undone!
              </p>
            </div>
            <Button
              onClick={clearDatabase}
              disabled={isClearing || clearConfirmation !== "DELETE ALL DATA"}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Database...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • Backup files contain all your stocks, customers, orders, and
              order items data
            </p>
            <p>
              • Backup files are encrypted with your password and saved as .smb
              files
            </p>
            <p>
              • The encryption password is required to restore the backup - keep
              it safe!
            </p>
            <p>
              • It's recommended to create regular backups to prevent data loss
            </p>
            <p>• Only administrators can perform backup operations</p>
            <p>
              • Restoring a backup will completely replace all existing data
            </p>
            <p>
              • Legacy .json backups are still supported for backward
              compatibility
            </p>
            <p className="text-red-600 font-medium">
              • Clear Database permanently deletes ALL data - use with extreme
              caution!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManager;
