
import { Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: '/', label: 'Dashboard', icon: BarChart3, path: '/' },
    { id: 'stock', label: 'Stock Management', icon: Package, path: '/stock' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/orders' },
  ];

  return (
    <div className="w-16 lg:w-64 bg-slate-900 text-white h-screen flex-shrink-0 fixed z-30 flex flex-col">
      <div className="p-3 lg:p-6 flex-shrink-0">
        <h2 className="text-lg lg:text-xl font-bold hidden lg:block">Factory Stock</h2>
        <h2 className="text-xs font-bold lg:hidden">FS</h2>
        <p className="text-slate-400 text-xs lg:text-sm hidden lg:block">Management System</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 lg:px-6 py-3 text-left hover:bg-slate-800 transition-colors",
                isActive && "bg-blue-600 border-r-2 border-blue-400"
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
