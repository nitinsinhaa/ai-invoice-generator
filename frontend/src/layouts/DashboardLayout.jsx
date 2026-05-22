import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Toaster } from 'react-hot-toast';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto page-shell">
        <Outlet />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default DashboardLayout;
