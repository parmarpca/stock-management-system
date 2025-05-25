import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  lowStockCount?: number;
  onLowStockClick?: () => void;
}

const Layout = ({
  children,
  title,
  lowStockCount = 0,
  onLowStockClick,
}: LayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const handleLowStockClick = () => {
    navigate("/stock?filter=low");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 ml-16 lg:ml-64">
        <header className="bg-white shadow-sm border-b px-3 lg:px-6 py-3 lg:py-4 flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
            <div className="flex items-center space-x-2">
              {lowStockCount > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center space-x-1 cursor-pointer text-xs"
                  onClick={
                    onLowStockClick ? onLowStockClick : handleLowStockClick
                  }
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {lowStockCount} Low Stock
                  </span>
                  <span className="sm:hidden">{lowStockCount}</span>
                </Badge>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-gray-500">
                        {isAdmin ? "Administrator" : "User"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
