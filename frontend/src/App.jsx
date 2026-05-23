import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { InventoryProvider } from './context/InventoryContext';
import { ExpenseProvider } from './context/ExpenseContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <AppProvider>
        <InventoryProvider>
          <ExpenseProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="transactions" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
                  <Route path="invoices" element={<ErrorBoundary><Invoices /></ErrorBoundary>} />
                  <Route path="expenses" element={<ErrorBoundary><Expenses /></ErrorBoundary>} />
                  <Route path="inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
                  <Route path="wallet" element={<ErrorBoundary><Wallet /></ErrorBoundary>} />
                  <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </ExpenseProvider>
        </InventoryProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
