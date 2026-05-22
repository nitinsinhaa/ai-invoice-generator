import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Settings, 
  LogOut,
  FileText,
  Package,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', subtitle: 'Overview & AI insights' },
    { path: '/transactions', icon: FileText, label: 'Sales History', subtitle: 'Money in when invoices paid' },
    { path: '/invoices', icon: Receipt, label: 'Invoices', subtitle: 'Bills to customers' },
    { path: '/expenses', icon: TrendingDown, label: 'Expenses', subtitle: 'Business spending' },
    { path: '/inventory', icon: Package, label: 'Inventory', subtitle: 'Products & stock' },
    { path: '/wallet', icon: Wallet, label: 'My Wallet', subtitle: 'Cash deposits & withdrawals' },
    { path: '/settings', icon: Settings, label: 'Settings', subtitle: 'Profile & tax' },
  ];

  return (
    <div className="sidebar-panel">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-heading">AI Invoice</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <span className="block truncate">{item.label}</span>
              {item.subtitle && (
                <span className="block truncate text-xs opacity-70 font-normal">{item.subtitle}</span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={logout}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
