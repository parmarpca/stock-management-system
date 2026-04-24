import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  hasAluminiumAccess: boolean;
  hasHardwareAccess: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    isAdmin?: boolean
  ) => Promise<{ error: AuthError | null }>;
  createUser: (
    email: string,
    password: string,
    isAdmin?: boolean
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAluminiumAccess, setHasAluminiumAccess] = useState(true);
  const [hasHardwareAccess, setHasHardwareAccess] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      const isUserAdmin = await checkUserRole(session?.user);
      await fetchUserPermissions(session?.user, isUserAdmin);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      const isUserAdmin = await checkUserRole(session?.user);
      await fetchUserPermissions(session?.user, isUserAdmin);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return false;
    }

    try {
      // Check if user has admin role in user_metadata or app_metadata
      const adminEmails = ["projects.smit@gmail.com"]; // You can configure this
      const userEmail = user.email;

      // Check if user is in admin list or has admin role in metadata
      const isUserAdmin =
        adminEmails.includes(userEmail || "") ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin";

      setIsAdmin(isUserAdmin);
      return isUserAdmin;
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
      return false;
    }
  };

  const fetchUserPermissions = async (user: User | null, isUserAdmin: boolean = false) => {
    if (!user) {
      setHasAluminiumAccess(true);
      setHasHardwareAccess(false);
      return;
    }

    if (isUserAdmin) {
      setHasAluminiumAccess(true);
      setHasHardwareAccess(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("has_aluminium_access, has_hardware_access")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasAluminiumAccess(data.has_aluminium_access);
        setHasHardwareAccess(data.has_hardware_access);
      } else {
        // Default permissions if not found
        setHasAluminiumAccess(true);
        setHasHardwareAccess(false);
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      setHasAluminiumAccess(true);
      setHasHardwareAccess(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    isAdminUser = false
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: isAdminUser ? "admin" : "user",
        },
      },
    });
    return { error };
  };

  const createUser = async (
    email: string,
    password: string,
    isAdminUser = false
  ) => {
    // This function is for admin-only user creation
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: isAdminUser ? "admin" : "user",
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    hasAluminiumAccess,
    hasHardwareAccess,
    signIn,
    signUp,
    createUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
