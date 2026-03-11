import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Drawer } from 'antd';
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
  ShopOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  HomeOutlined,
  BookOutlined,
  AccountBookOutlined,
} from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, logout } = useAuthStore();

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    const userRole = user?.role?.toUpperCase();
    
    const allItems = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE', 'EMPLOYEE', 'DEVELOPER'],
      },
      {
        key: '/attendance',
        icon: <ClockCircleOutlined />,
        label: 'Attendance',
        onClick: () => navigate('/attendance'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE', 'EMPLOYEE', 'DEVELOPER'],
      },
      {
        key: '/kpi',
        icon: <TrophyOutlined />,
        label: 'My KPI',
        onClick: () => navigate('/kpi'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE', 'EMPLOYEE', 'DEVELOPER'],
      },
      {
        key: '/customers',
        icon: <UserOutlined />,
        label: 'Customers',
        onClick: () => navigate('/customers'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE'],
      },
      {
        key: '/items',
        icon: <ShoppingOutlined />,
        label: 'Products/Services',
        onClick: () => navigate('/items'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/invoices',
        icon: <FileTextOutlined />,
        label: 'Invoices',
        onClick: () => navigate('/invoices'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE'],
      },
      {
        key: '/payments',
        icon: <DollarOutlined />,
        label: 'Payments',
        onClick: () => navigate('/payments'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/expenses',
        icon: <DollarOutlined />,
        label: 'Expenses',
        onClick: () => navigate('/expenses'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/leads',
        icon: <UserOutlined />,
        label: 'Leads',
        onClick: () => navigate('/leads'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE'],
      },
      {
        key: '/proposals',
        icon: <FileSearchOutlined />,
        label: 'Proposals',
        onClick: () => navigate('/proposals'),
        roles: ['ADMIN', 'LEAD_MANAGER', 'DM_EXECUTIVE'],
      },
      {
        key: '/vendors',
        icon: <ShopOutlined />,
        label: 'Vendors',
        onClick: () => navigate('/vendors'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/purchase-orders',
        icon: <ShoppingCartOutlined />,
        label: 'Purchase Orders',
        onClick: () => navigate('/purchase-orders'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/goods-receipts',
        icon: <InboxOutlined />,
        label: 'Goods Receipts',
        onClick: () => navigate('/goods-receipts'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/supplier-invoices',
        icon: <FileTextOutlined />,
        label: 'Supplier Invoices',
        onClick: () => navigate('/supplier-invoices'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/warehouses',
        icon: <HomeOutlined />,
        label: 'Warehouses',
        onClick: () => navigate('/warehouses'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/inventory',
        icon: <InboxOutlined />,
        label: 'Inventory',
        onClick: () => navigate('/inventory'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/chart-of-accounts',
        icon: <AccountBookOutlined />,
        label: 'Chart of Accounts',
        onClick: () => navigate('/chart-of-accounts'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/journal-entries',
        icon: <BookOutlined />,
        label: 'Journal Entries',
        onClick: () => navigate('/journal-entries'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/employees',
        icon: <UserOutlined />,
        label: 'Employees',
        onClick: () => navigate('/employees'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/kpi-review',
        icon: <BarChartOutlined />,
        label: 'KPI Review',
        onClick: () => navigate('/kpi-review'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Reports',
        onClick: () => navigate('/reports'),
        roles: ['ADMIN', 'LEAD_MANAGER'],
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => navigate('/settings'),
        roles: ['ADMIN'],
      },
      {
        key: '/role-settings',
        icon: <SecurityScanOutlined />,
        label: 'Role Settings',
        onClick: () => navigate('/role-settings'),
        roles: ['ADMIN'],
      },
      {
        key: '/feature-control',
        icon: <ControlOutlined />,
        label: 'Feature Control',
        onClick: () => navigate('/feature-control'),
        roles: ['ADMIN'],
      },
      {
        key: '/admin/security',
        icon: <SecurityScanOutlined />,
        label: 'Security Dashboard',
        onClick: () => navigate('/admin/security'),
        roles: ['ADMIN'],
      },
    ];

    // Filter items based on user role
    return allItems.filter(item => !item.roles || item.roles.includes(userRole || ''));
  }, [navigate, user?.role]);

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const siderContent = (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          padding: collapsed && !isMobile ? 0 : '0 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {!collapsed || isMobile ? (
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
              <Text strong style={{ fontSize: 16, display: 'block', lineHeight: '20px', color: '#ffffff' }}>
                Triverse
              </Text>
              <Text style={{ fontSize: 11, lineHeight: '14px', color: '#9ca3af' }}>
                Systems Platform
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
        theme="dark"
        style={{ 
          borderRight: 0,
          background: 'transparent'
        }}
        onClick={handleMenuClick}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#000000' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          width={220} 
          theme="dark" 
          style={{ 
            background: '#000000',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          closable={false}
          width={280}
          styles={{ body: { padding: 0, background: '#000000' } }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout style={{ background: '#000000' }}>
        <Header style={{ 
          padding: isMobile ? '0 12px' : '0 24px', 
          background: '#000000', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => isMobile ? setMobileDrawerVisible(true) : setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            {!isMobile && (
              <div>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>English</Text>
                <Text style={{ margin: '0 8px', color: '#9ca3af' }}>|</Text>
                <Text strong style={{ fontSize: 13, color: '#ffffff' }}>{company?.name || 'USA Company'}</Text>
              </div>
            )}
          </div>

          <Space size={isMobile ? "small" : "large"}>

            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar size={isMobile ? "default" : "large"} icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ 
          margin: 0, 
          padding: 0, 
          background: '#000000', 
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
