import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

// Check if Edge Function is available
const isEdgeFunctionAvailable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("bright-service", {
      body: { action: "test" },
    });
    return !error;
  } catch {
    return false;
  }
};

export const userService = {
  // List all users
  async listUsers(): Promise<UserData[]> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "bright-service",
        {
          body: { action: "list" },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to fetch users");
      }

      if (data?.users) {
        return data.users;
      }

      // If no users data, return current user as fallback
      throw new Error("No users data received");
    } catch (error) {
      console.error("Error listing users:", error);
      // Return current user as fallback
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return [
          {
            id: user.id,
            email: user.email || "",
            role: "admin",
            created_at: user.created_at || new Date().toISOString(),
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at,
          },
        ];
      }
      throw error;
    }
  },

  // Create a new user
  async createUser(
    email: string,
    password: string,
    role: "admin" | "user" = "user"
  ): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "bright-service",
        {
          body: { action: "create", email, password, role },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to create user");
      }

      return data?.user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "bright-service",
        {
          body: { action: "delete", userId },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
