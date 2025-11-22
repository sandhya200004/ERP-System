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
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

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
          colorPrimary: '#667eea',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

