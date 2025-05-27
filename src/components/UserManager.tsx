import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  Loader2,
  AlertTriangle,
  Shield,
  User,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserData } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";

const UserManager = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, user: currentUser } = useAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersList = await userService.listUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (
        error instanceof Error &&
        error.message.includes("Edge Function not deployed")
      ) {
        // Show current user as fallback
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUsers([
            {
              id: user.id,
              email: user.email || "",
              role: "admin",
              created_at: user.created_at || new Date().toISOString(),
              last_sign_in_at: user.last_sign_in_at,
              email_confirmed_at: user.email_confirmed_at,
            },
          ]);
        }
      } else {
        alert("Failed to fetch users. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setIsCreating(true);
    try {
      await userService.createUser(email, password, role);
      alert("User created successfully!");
      setEmail("");
      setPassword("");
      setRole("user");
      setIsCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(userId);
    try {
      await userService.deleteUser(userId);
      alert("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again."
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600">Access Denied</h3>
        <p className="text-gray-600">
          Only administrators can access user management functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">User Management</h2>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Create User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Create New User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-email">Email Address</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="user-role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value: "admin" | "user") => setRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>User</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Administrator</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  The user will receive a confirmation email to activate their
                  account.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading users...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {users.length === 1 && users[0].email === currentUser?.email && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Edge Function Deployment Required
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To see all users and enable full user management
                    functionality, you need to deploy the Edge Function:
                  </p>
                  <div className="bg-blue-100 rounded p-3 font-mono text-sm text-blue-900">
                    <p>1. Install Docker Desktop</p>
                    <p>2. Run: npx supabase login</p>
                    <p>
                      3. Run: npx supabase functions deploy user-management
                      --project-ref zsiytgieabllretyyrpi
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Currently showing only your account as fallback. After
                    deployment, you'll see all users.
                  </p>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    if (user.email === "projects.smit@gmail.com") {
                      return null;
                    }
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {user.role === "admin" ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {user.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.email_confirmed_at ? "default" : "outline"
                            }
                          >
                            {user.email_confirmed_at ? "Confirmed" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          {formatDateTime(user.last_sign_in_at)}
                        </TableCell>
                        <TableCell>
                          {user.id === currentUser?.id ? (
                            <span className="text-gray-400 text-sm">
                              Current User
                            </span>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isDeleting === user.id}
                                >
                                  {isDeleting === user.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the user "
                                    {user.email}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-8"
                      >
                        No users found. Create your first user above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Management Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Only administrators can create and manage users</p>
            <p>
              • Users are managed through Supabase Auth - no separate user table
              needed
            </p>
            <p>
              • New users are automatically confirmed and can sign in
              immediately
            </p>
            <p>
              • Admin users have access to all system features including backups
              and user management
            </p>
            <p>
              • Regular users can access stock management, orders, and customer
              features
            </p>
            <p>• User passwords must be at least 6 characters long</p>
            <p>
              • Users can be assigned either "User" or "Administrator" roles
            </p>
            <p>• You cannot delete your own account for security reasons</p>
            <p>• User data is fetched in real-time from Supabase Auth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManager;
