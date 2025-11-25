import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, App } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DollarOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const { message } = App.useApp();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { company, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    const allItems = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/'),
        permission: 'VIEW_DASHBOARD' as const,
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: 'Customers',
        onClick: () => navigate('/customers'),
        permission: 'VIEW_CUSTOMERS' as const,
      },
      {  key: '/items',
        icon: <ShoppingOutlined />,
        label: 'Products/Services',
        onClick: () => navigate('/items'),
        permission: 'VIEW_ITEMS' as const,
      },
      {
        key: '/invoices',
        icon: <FileTextOutlined />,
        label: 'Invoices',
        onClick: () => navigate('/invoices'),
        permission: 'VIEW_INVOICES' as const,
      },
      {
        key: '/quotes',
        icon: <FileSearchOutlined />,
        label: 'Quotes',
        onClick: () => navigate('/quotes'),
        permission: 'VIEW_QUOTES' as const,
      },
      {
        key: '/payments',
        icon: <DollarOutlined />,
        label: 'Payments',
        onClick: () => navigate('/payments'),
        permission: 'VIEW_PAYMENTS' as const,
      },
      {
        key: '/expenses',
        icon: <DollarOutlined />,
        label: 'Expenses',
        onClick: () => navigate('/expenses'),
        permission: 'VIEW_EXPENSES' as const,
      },
      {
        key: '/leads',
        icon: <UserOutlined />,
        label: 'Leads',
        onClick: () => navigate('/leads'),
        permission: 'VIEW_LEADS' as const,
      },
      {
        key: '/proposals',
        icon: <FileSearchOutlined />,
        label: 'Proposals',
        onClick: () => navigate('/proposals'),
        permission: 'VIEW_PROPOSALS' as const,
      },
      {
        key: '/attendance',
        icon: <ClockCircleOutlined />,
        label: 'Attendance',
        onClick: () => navigate('/attendance'),
        permission: 'VIEW_ATTENDANCE' as const,
      },
      {
        key: '/kpi',
        icon: <TrophyOutlined />,
        label: 'My KPI',
        onClick: () => navigate('/kpi'),
        permission: 'VIEW_KPI' as const,
      },
      {
        key: '/employees',
        icon: <UserOutlined />,
        label: 'Employees',
        onClick: () => navigate('/employees'),
        permission: 'VIEW_EMPLOYEES' as const,
      },
      {
        key: '/kpi-review',
        icon: <BarChartOutlined />,
        label: 'KPI Review',
        onClick: () => navigate('/kpi-review'),
        permission: 'VIEW_KPI' as const,
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Reports',
        onClick: () => navigate('/reports'),
        permission: 'VIEW_REPORTS' as const,
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => navigate('/settings'),
        permission: 'VIEW_SETTINGS' as const,
      },
      {
        key: '/role-settings',
        icon: <SecurityScanOutlined />,
        label: 'Role Settings',
        onClick: () => navigate('/role-settings'),
        permission: 'MANAGE_COMPANY' as const,
      },
      {
        key: '/feature-control',
        icon: <ControlOutlined />,
        label: 'Feature Control',
        onClick: () => navigate('/feature-control'),
        permission: 'VIEW_SETTINGS' as const,
      },
    ];

    // Single company mode - show all menu items
    return allItems;
  }, [navigate]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/triverse-logo.png" 
                alt="TriVerse Solutions" 
                style={{ 
                  height: 40, 
                  width: 'auto' 
                }} 
              />
              <div>
                <Text strong style={{ fontSize: 16, display: 'block', lineHeight: '20px', color: '#2c3e7d' }}>
                  TriVerse
                </Text>
                <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px' }}>
                  ERP/CRM System
                </Text>
              </div>
            </div>
          ) : (
            <img 
              src="/triverse-logo.png" 
              alt="TriVerse" 
              style={{ 
                height: 40, 
                width: 'auto' 
              }} 
            />
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>English</Text>
              <Text type="secondary" style={{ margin: '0 8px' }}>|</Text>
              <Text strong style={{ fontSize: 13 }}>{company?.name || 'USA Company'}</Text>
            </div>
          </div>

          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                fontWeight: 600,
                height: 42,
                padding: '0 24px'
              }}
              onClick={() => message.info('Contact us for custom features: sales@triverse.com')}
            >
              Request Custom Features
            </Button>
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar size="large" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px', padding: 24, background: '#f0f2f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
