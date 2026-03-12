import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, App as AntApp } from 'antd';
import { useAuthStore } from './store/authStore';

// Eager load critical routes
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/EnhancedDashboardPage';

// Lazy load non-critical routes for better performance
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ItemsPage = lazy(() => import('./pages/ItemsPage'));
const InvoicesPage = lazy(() => import('./pages/EnhancedInvoicesPage'));
const QuotesPage = lazy(() => import('./pages/QuotesPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const MyKPIPage = lazy(() => import('./pages/MyKPIPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const KPIReviewPage = lazy(() => import('./pages/KPIReviewPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const RoleSettingsPage = lazy(() => import('./pages/RoleSettingsPage'));
const FeatureControlPage = lazy(() => import('./pages/FeatureControlPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const SecurityDashboard = lazy(() => import('./pages/admin/SecurityDashboard'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const VendorsPage = lazy(() => import('./pages/VendorsPage'));
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage'));
const GoodsReceiptsPage = lazy(() => import('./pages/GoodsReceiptsPage'));
const SupplierInvoicesPage = lazy(() => import('./pages/SupplierInvoicesPage'));
const WarehousesPage = lazy(() => import('./pages/WarehousesPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ChartOfAccountsPage = lazy(() => import('./pages/ChartOfAccountsPage'));
const JournalEntriesPage = lazy(() => import('./pages/JournalEntriesPage'));
const PlatformAdminLogin = lazy(() => import('./pages/platform-admin/PlatformAdminLogin'));
const PlatformAdminDashboard = lazy(() => import('./pages/platform-admin/PlatformAdminDashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#000000'
  }}>
    <Spin size="large" tip="Loading..." />
  </div>
);

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
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Suspense fallback={<LoadingFallback />}><RegisterPage /></Suspense>} />
              <Route path="/status" element={<Suspense fallback={<LoadingFallback />}><StatusPage /></Suspense>} />
              
              {/* Platform Admin Routes */}
              <Route path="/platform-admin/login" element={<Suspense fallback={<LoadingFallback />}><PlatformAdminLogin /></Suspense>} />
              <Route path="/platform-admin/dashboard" element={<Suspense fallback={<LoadingFallback />}><PlatformAdminDashboard /></Suspense>} />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="customers" element={<Suspense fallback={<LoadingFallback />}><CustomersPage /></Suspense>} />
                <Route path="items" element={<Suspense fallback={<LoadingFallback />}><ItemsPage /></Suspense>} />
                <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoicesPage /></Suspense>} />
                <Route path="quotes" element={<Suspense fallback={<LoadingFallback />}><QuotesPage /></Suspense>} />
                <Route path="payments" element={<Suspense fallback={<LoadingFallback />}><PaymentsPage /></Suspense>} />
                <Route path="attendance" element={<Suspense fallback={<LoadingFallback />}><AttendancePage /></Suspense>} />
                <Route path="kpi" element={<Suspense fallback={<LoadingFallback />}><MyKPIPage /></Suspense>} />
                <Route path="employees" element={<Suspense fallback={<LoadingFallback />}><EmployeesPage /></Suspense>} />
                <Route path="kpi-review" element={<Suspense fallback={<LoadingFallback />}><KPIReviewPage /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><ReportsPage /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>} />
                <Route path="role-settings" element={<Suspense fallback={<LoadingFallback />}><RoleSettingsPage /></Suspense>} />
                <Route path="feature-control" element={<Suspense fallback={<LoadingFallback />}><FeatureControlPage /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<LoadingFallback />}><ProfilePage /></Suspense>} />
                <Route path="leads" element={<Suspense fallback={<LoadingFallback />}><LeadsPage /></Suspense>} />
                <Route path="proposals" element={<Suspense fallback={<LoadingFallback />}><ProposalsPage /></Suspense>} />
                <Route path="expenses" element={<Suspense fallback={<LoadingFallback />}><ExpensesPage /></Suspense>} />
                <Route path="admin/security" element={<Suspense fallback={<LoadingFallback />}><SecurityDashboard /></Suspense>} />
                {/* Procurement & Supply Chain */}
                <Route path="vendors" element={<Suspense fallback={<LoadingFallback />}><VendorsPage /></Suspense>} />
                <Route path="purchase-orders" element={<Suspense fallback={<LoadingFallback />}><PurchaseOrdersPage /></Suspense>} />
                <Route path="goods-receipts" element={<Suspense fallback={<LoadingFallback />}><GoodsReceiptsPage /></Suspense>} />
                <Route path="supplier-invoices" element={<Suspense fallback={<LoadingFallback />}><SupplierInvoicesPage /></Suspense>} />
                {/* Inventory & Warehouse */}
                <Route path="warehouses" element={<Suspense fallback={<LoadingFallback />}><WarehousesPage /></Suspense>} />
                <Route path="inventory" element={<Suspense fallback={<LoadingFallback />}><InventoryPage /></Suspense>} />
                {/* Accounting & Finance */}
                <Route path="chart-of-accounts" element={<Suspense fallback={<LoadingFallback />}><ChartOfAccountsPage /></Suspense>} />
                <Route path="journal-entries" element={<Suspense fallback={<LoadingFallback />}><JournalEntriesPage /></Suspense>} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

