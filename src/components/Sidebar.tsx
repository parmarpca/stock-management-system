
import { Package, Users, FileText, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stock', label: 'Stock Management', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'slips', label: 'Slips', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold">Factory Stock</h2>
        <p className="text-slate-400 text-sm">Management System</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-slate-800 transition-colors",
                activeTab === item.id && "bg-blue-600 border-r-2 border-blue-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
