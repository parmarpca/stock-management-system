import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth Admin API
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { action } = body;

    // Check if user is admin for user management actions
    if (["list", "create", "delete"].includes(action)) {
      const adminEmails = ["projects.smit@gmail.com"];
      const isAdmin =
        adminEmails.includes(user.email || "") ||
        user.user_metadata?.role === "admin" ||
        user.app_metadata?.role === "admin";

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    switch (action) {
      case "test":
        return new Response(
          JSON.stringify({ success: true, message: "Function is available" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "list":
        // List all users
        const { data: users, error } =
          await supabaseAdmin.auth.admin.listUsers();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Format user data
        const formattedUsers = users.users.map((user) => ({
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || user.app_metadata?.role || "user",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
        }));

        return new Response(JSON.stringify({ users: formattedUsers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case "create":
        const { email, password, role } = body;

        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Create user
        const { data: createData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { role: role || "user" },
            email_confirm: true,
          });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ user: createData.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case "delete":
        const { userId } = body;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Prevent deletion of the current admin user
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Delete user
        const { error: deleteError } =
          await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        // Handle other actions or return default response
        return new Response(
          JSON.stringify({ message: "Hello from bright-service!", action }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
