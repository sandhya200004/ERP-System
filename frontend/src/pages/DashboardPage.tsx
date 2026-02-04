import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Progress, Spin } from 'antd';
import { 
  FileTextOutlined, 
  RiseOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { customerService } from '../services/customer.service';
import { itemService } from '../services/item.service';
import { invoiceService } from '../services/invoice.service';
import { quoteService } from '../services/quote.service';
import { useAuthStore } from '../store/authStore';
import EmployeeBadgeModal from '../components/EmployeeBadgeModal';

const { Title, Text } = Typography;

interface Stats {
  totalCustomers: number;
  totalItems: number;
  totalInvoices: number;
  totalRevenue: number;
  invoicesByStatus: { [key: string]: number };
  quotesByStatus: { [key: string]: number };
  recentInvoices: any[];
  recentQuotes: any[];
  customerGrowth: number;
  unpaidAmount: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalItems: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    invoicesByStatus: {},
    quotesByStatus: {},
    recentInvoices: [],
    recentQuotes: [],
    customerGrowth: 30,
    unpaidAmount: 0,
  });

  useEffect(() => {
    // Only fetch admin stats if user is ADMIN or LEAD_MANAGER
    const userRole = user?.role?.toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'LEAD_MANAGER') {
      fetchStats();
    } else {
      // For employees, just stop loading
      setLoading(false);
    }
  }, [user?.role]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [customerStats, itemStats, invoiceStats, invoicesData, quotesData] = await Promise.all([
        customerService.getStats().catch(() => ({ total: 0 })),
        itemService.getStats().catch(() => ({ total: 0 })),
        invoiceService.getStats().catch(() => ({ total: 0, totalRevenue: 0 })),
        invoiceService.getAll().catch(() => []),
        quoteService.getAll().catch(() => []),
      ]);

      // Ensure invoicesData is an array
      const invoices = Array.isArray(invoicesData) ? invoicesData : [];
      const quotes = Array.isArray(quotesData) ? quotesData : [];

      // Calculate status breakdowns
      const invoicesByStatus: { [key: string]: number } = {
        draft: 0,
        pending: 0,
        unpaid: 0,
        overdue: 0,
        partially: 0,
        paid: 0,
      };

      const quotesByStatus: { [key: string]: number } = {
        draft: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
      };

      let unpaidAmount = 0;
      invoices.forEach((inv: any) => {
        if (inv.status === 'draft') invoicesByStatus.draft++;
        else if (inv.status === 'sent') invoicesByStatus.pending++;
        else if (inv.status === 'partially_paid') invoicesByStatus.partially++;
        else if (inv.status === 'paid') invoicesByStatus.paid++;
        
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          unpaidAmount += Number(inv.amountDue || 0);
        }
      });

      // Count quotes by status
      quotes.forEach((quote: any) => {
        const status = quote.status?.toLowerCase();
        if (quotesByStatus[status] !== undefined) {
          quotesByStatus[status]++;
        }
      });

      setStats({
        totalCustomers: customerStats.total || 0,
        totalItems: itemStats.total || 0,
        totalInvoices: invoiceStats.total || 0,
        totalRevenue: invoiceStats.totalRevenue || 0,
        invoicesByStatus,
        quotesByStatus,
        recentInvoices: invoices.slice(0, 5),
        recentQuotes: quotes.slice(0, 5),
        customerGrowth: 30,
        unpaidAmount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPercent = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const invoiceColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      render: (val: number) => `$${Number(val).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          draft: 'default',
          sent: 'processing',
          partially_paid: 'warning',
          paid: 'success',
          cancelled: 'error',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Employee Dashboard (Limited View)
  const userRole = user?.role?.toUpperCase();
  if (userRole === 'EMPLOYEE' || userRole === 'DEVELOPER') {
    return (
      <div style={{ padding: '24px', backgroundColor: '#000', minHeight: '100vh' }}>
        <Title level={2} style={{ marginBottom: '24px', color: '#fff' }}>Welcome, {user?.firstName}! 👋</Title>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card 
              variant="borderless" 
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '150px' }}
              onClick={() => window.location.href = '/attendance'}
              hoverable
            >
              <Statistic
                title={<span style={{ color: '#fff', fontSize: '16px' }}>Mark Attendance</span>}
                value=""
                valueStyle={{ color: '#fff', fontSize: '20px' }}
                prefix={<FileTextOutlined style={{ fontSize: '48px', color: '#fff' }} />}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card 
              variant="borderless" 
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', height: '150px' }}
              onClick={() => window.location.href = '/kpi'}
              hoverable
            >
              <Statistic
                title={<span style={{ color: '#fff', fontSize: '16px' }}>My KPI Tasks</span>}
                value=""
                valueStyle={{ color: '#fff', fontSize: '20px' }}
                prefix={<RiseOutlined style={{ fontSize: '48px', color: '#fff' }} />}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card 
              variant="borderless" 
              style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', height: '150px' }}
              onClick={() => setShowBadgeModal(true)}
              hoverable
            >
              <Statistic
                title={<span style={{ color: '#fff', fontSize: '16px' }}>My Badge</span>}
                value=""
                valueStyle={{ color: '#fff', fontSize: '20px' }}
                prefix={<IdcardOutlined style={{ fontSize: '48px', color: '#fff' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: '24px' }}>
          <Title level={4}>Quick Actions</Title>
          <Text type="secondary">
            • Track your daily attendance<br />
            • View and submit your KPI tasks<br />
            • View your digital employee badge<br />
          </Text>
        </Card>

        {/* Employee Badge Modal */}
        <EmployeeBadgeModal
          visible={showBadgeModal}
          onClose={() => setShowBadgeModal(false)}
          employeeName={user ? `${user.firstName} ${user.lastName}` : 'Employee'}
          employeeTitle={typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'Employee'}
          employeeId={user?.employeeId || 'N/A'}
          enableWebcam={false}
          title="My Digital Badge"
        />
      </div>
    );
  }

  // Admin/Manager Dashboard (Full View)
  return (
    <div style={{ padding: '24px', backgroundColor: '#000', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px', color: '#fff' }}>Dashboard</Title>

      {/* Top Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Invoices This Month</span>}
              value={stats.totalRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#fff', marginTop: '8px' }}>
                  <FileTextOutlined /> {stats.totalInvoices} invoices
                </div>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Quotes For Customers</span>}
              value={0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#fff', marginTop: '8px' }}>
                  <FileTextOutlined /> 0 quotes
                </div>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Quotes For Leads</span>}
              value={0}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#fff', marginTop: '8px' }}>
                  <FileTextOutlined /> 0 quotes
                </div>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>Unpaid</span>}
              value={stats.unpaidAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: '12px', color: '#fff', marginTop: '8px' }}>
                  Not Paid
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Status Breakdown Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={6}>
          <Card title="Invoices" variant="borderless">
            <div style={{ marginBottom: '12px' }}>
              <Text>Draft</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.draft, stats.totalInvoices)} size="small" showInfo={false} />
                <Text>{getStatusPercent(stats.invoicesByStatus.draft, stats.totalInvoices)} %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Pending</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.pending, stats.totalInvoices)} size="small" showInfo={false} />
                <Text>{getStatusPercent(stats.invoicesByStatus.pending, stats.totalInvoices)} %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Unpaid</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.unpaid, stats.totalInvoices)} size="small" showInfo={false} />
                <Text>{getStatusPercent(stats.invoicesByStatus.unpaid, stats.totalInvoices)} %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Overdue</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.overdue, stats.totalInvoices)} size="small" showInfo={false} strokeColor="#ff4d4f" />
                <Text>{getStatusPercent(stats.invoicesByStatus.overdue, stats.totalInvoices)} %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Partially</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.partially, stats.totalInvoices)} size="small" showInfo={false} strokeColor="#faad14" />
                <Text>{getStatusPercent(stats.invoicesByStatus.partially, stats.totalInvoices)} %</Text>
              </div>
            </div>
            <div>
              <Text>Paid</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={getStatusPercent(stats.invoicesByStatus.paid, stats.totalInvoices)} size="small" showInfo={false} strokeColor="#52c41a" />
                <Text>{getStatusPercent(stats.invoicesByStatus.paid, stats.totalInvoices)} %</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="Quotes For Customers" variant="borderless">
            <div style={{ marginBottom: '12px' }}>
              <Text>Draft</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Pending</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Sent</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Declined</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#ff4d4f" />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Accepted</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#52c41a" />
                <Text>0 %</Text>
              </div>
            </div>
            <div>
              <Text>Expired</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#ff4d4f" />
                <Text>0 %</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="Quotes For Leads" variant="borderless">
            <div style={{ marginBottom: '12px' }}>
              <Text>Draft</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Pending</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Sent</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Declined</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#ff4d4f" />
                <Text>0 %</Text>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <Text>Accepted</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#52c41a" />
                <Text>0 %</Text>
              </div>
            </div>
            <div>
              <Text>Expired</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Progress percent={0} size="small" showInfo={false} strokeColor="#ff4d4f" />
                <Text>0 %</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card title="Customers" variant="borderless">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Progress 
                type="circle" 
                percent={0} 
                format={() => '0%'}
                size={120}
              />
              <div style={{ marginTop: '16px' }}>
                <Text strong>New Customer This Month</Text>
              </div>
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
              <Text>Active Customer</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <RiseOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>{stats.customerGrowth}.00 %</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Recent Invoices" variant="borderless">
            <Table 
              dataSource={stats.recentInvoices}
              columns={invoiceColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Recent Quotes" variant="borderless">
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No quotes available
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
