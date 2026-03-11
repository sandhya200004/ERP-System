import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, App as AntApp } from 'antd';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/EnhancedDashboardPage';
import CustomersPage from './pages/CustomersPage';
import ItemsPage from './pages/ItemsPage';
import InvoicesPage from './pages/EnhancedInvoicesPage';
import QuotesPage from './pages/QuotesPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import MyKPIPage from './pages/MyKPIPage';
import EmployeesPage from './pages/EmployeesPage';
import KPIReviewPage from './pages/KPIReviewPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import RoleSettingsPage from './pages/RoleSettingsPage';
import FeatureControlPage from './pages/FeatureControlPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import LeadsPage from './pages/LeadsPage';
import ProposalsPage from './pages/ProposalsPage';
import ExpensesPage from './pages/ExpensesPage';
import SecurityDashboard from './pages/admin/SecurityDashboard';
import StatusPage from './pages/StatusPage';
import VendorsPage from './pages/VendorsPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import GoodsReceiptsPage from './pages/GoodsReceiptsPage';
import SupplierInvoicesPage from './pages/SupplierInvoicesPage';
import WarehousesPage from './pages/WarehousesPage';
import InventoryPage from './pages/InventoryPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import PlatformAdminLogin from './pages/platform-admin/PlatformAdminLogin';
import PlatformAdminDashboard from './pages/platform-admin/PlatformAdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          colorBgContainer: '#1a1a1a',
          colorBgElevated: '#1a1a1a',
          colorBorder: 'rgba(255, 255, 255, 0.08)',
          colorText: '#ffffff',
          colorTextSecondary: '#9ca3af',
          colorTextTertiary: '#6b7280',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/status" element={<StatusPage />} />
            
            {/* Platform Admin Routes */}
            <Route path="/platform-admin/login" element={<PlatformAdminLogin />} />
            <Route path="/platform-admin/dashboard" element={<PlatformAdminDashboard />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="quotes" element={<QuotesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="kpi" element={<MyKPIPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="kpi-review" element={<KPIReviewPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="role-settings" element={<RoleSettingsPage />} />
              <Route path="feature-control" element={<FeatureControlPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="proposals" element={<ProposalsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="admin/security" element={<SecurityDashboard />} />
              {/* Procurement & Supply Chain */}
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="goods-receipts" element={<GoodsReceiptsPage />} />
              <Route path="supplier-invoices" element={<SupplierInvoicesPage />} />
              {/* Inventory & Warehouse */}
              <Route path="warehouses" element={<WarehousesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              {/* Accounting & Finance */}
              <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
              <Route path="journal-entries" element={<JournalEntriesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

