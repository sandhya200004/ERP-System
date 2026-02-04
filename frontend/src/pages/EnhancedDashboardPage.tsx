import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Table, 
  Tag, 
  Progress, 
  Spin,
  List,
  Avatar,
  Space,
  Badge,
  Timeline,
  Select,
  Button,
} from 'antd';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  FileTextOutlined, 
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  TeamOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { customerService } from '../services/customer.service';
import { itemService } from '../services/item.service';
import { invoiceService } from '../services/invoice.service';
import { quoteService } from '../services/quote.service';
import { paymentService } from '../services/payment.service';

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
  recentPayments: any[];
  customerGrowth: number;
  unpaidAmount: number;
  totalPayments: number;
  revenueByMonth: any[];
  customersByMonth: any[];
  topItems: any[];
}

const EnhancedDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalItems: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    invoicesByStatus: {},
    quotesByStatus: {},
    recentInvoices: [],
    recentQuotes: [],
    recentPayments: [],
    customerGrowth: 0,
    unpaidAmount: 0,
    totalPayments: 0,
    revenueByMonth: [],
    customersByMonth: [],
    topItems: [],
  });

  useEffect(() => {
    fetchStats();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        customerStats, 
        itemStats, 
        invoiceStats, 
        paymentStats,
        invoicesData,
        quotesData,
        paymentsData,
        customersData,
        itemsData
      ] = await Promise.all([
        customerService.getStats(),
        itemService.getStats(),
        invoiceService.getStats(),
        paymentService.getStats(),
        invoiceService.getAll(),
        quoteService.getAll(),
        paymentService.getAll(),
        customerService.getAll(),
        itemService.getAll(),
      ]);

      const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || [];
      const quotes: any[] = Array.isArray(quotesData) ? quotesData : (quotesData as any)?.data || [];
      const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || [];
      const customers = Array.isArray(customersData) ? customersData : customersData?.data || [];
      const items = Array.isArray(itemsData) ? itemsData : itemsData?.data || [];

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
        pending: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
      };

      // Calculate invoice statistics
      let unpaidAmount = 0;
      invoices.forEach((invoice: any) => {
        const status = invoice.status?.toLowerCase() || 'draft';
        invoicesByStatus[status] = (invoicesByStatus[status] || 0) + 1;
        
        if (['pending', 'unpaid', 'overdue', 'partially'].includes(status)) {
          unpaidAmount += Number(invoice.total || 0);
        }
      });

      // Calculate quote statistics
      quotes.forEach((quote: any) => {
        const status = quote.status?.toLowerCase() || 'draft';
        quotesByStatus[status] = (quotesByStatus[status] || 0) + 1;
      });

      // Calculate revenue by month (last 7 months)
      const revenueByMonth = generateRevenueByMonth(invoices, payments);
      
      // Calculate customer growth by month
      const customersByMonth = generateCustomersByMonth(customers);

      // Calculate top products/services
      const topItems = calculateTopItems(invoices, items);

      // Get recent activities
      const recentInvoicesFormatted = invoices.slice(0, 3).map((inv: any) => ({
        ...inv,
        type: 'invoice',
      }));
      
      const recentQuotesFormatted = quotes.slice(0, 2).map((quote: any) => ({
        ...quote,
        type: 'quote',
      }));

      const recentPaymentsFormatted = payments.slice(0, 2).map((payment: any) => ({
        ...payment,
        type: 'payment',
      }));

      // Calculate customer growth percentage
      const lastMonthCustomers = customers.filter((c: any) => {
        const createdDate = new Date(c.createdAt);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return createdDate < lastMonth;
      }).length;
      const customerGrowth = lastMonthCustomers > 0 
        ? Math.round(((customerStats.total - lastMonthCustomers) / lastMonthCustomers) * 100)
        : 0;

      setStats({
        totalCustomers: customerStats.total || 0,
        totalItems: itemStats.total || 0,
        totalInvoices: invoiceStats.total || 0,
        totalRevenue: Number(invoiceStats.totalRevenue || 0),
        invoicesByStatus,
        quotesByStatus,
        recentInvoices: recentInvoicesFormatted,
        recentQuotes: recentQuotesFormatted,
        recentPayments: recentPaymentsFormatted,
        customerGrowth,
        unpaidAmount,
        totalPayments: paymentStats.totalAmount || 0,
        revenueByMonth,
        customersByMonth,
        topItems,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate revenue data by month
  const generateRevenueByMonth = (invoices: any[], _payments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      // Calculate revenue from paid invoices
      const monthRevenue = invoices
        .filter((inv: any) => {
          if (!inv.invoiceDate) return false;
          const invDate = new Date(inv.invoiceDate);
          return invDate.getMonth() === monthIndex && 
                 ['paid', 'partially'].includes(inv.status?.toLowerCase());
        })
        .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);

      // Calculate payments for this month (not used for chart, kept for potential future use)
      // payments.filter((pay: any) => {
      //   if (!pay.paymentDate) return false;
      //   const payDate = new Date(pay.paymentDate);
      //   return payDate.getMonth() === monthIndex;
      // }).reduce((sum: number, pay: any) => sum + Number(pay.amount || 0), 0);

      // Estimate expenses as 60% of revenue
      const expenses = Math.round(monthRevenue * 0.6);
      const profit = monthRevenue - expenses;

      result.push({
        month: monthName,
        revenue: Math.round(monthRevenue),
        expenses,
        profit,
      });
    }

    return result;
  };

  // Helper function to generate customer growth data
  const generateCustomersByMonth = (customers: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];
    let cumulativeCount = 0;

    for (let i = 6; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      
      const monthCustomers = customers.filter((c: any) => {
        if (!c.createdAt) return false;
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() <= monthIndex;
      }).length;

      cumulativeCount = monthCustomers;

      result.push({
        month: monthName,
        customers: cumulativeCount,
      });
    }

    return result;
  };

  // Helper function to calculate top items/services
  const calculateTopItems = (invoices: any[], _items: any[]) => {
    const itemStats: { [key: string]: { name: string; sales: number; count: number } } = {};

    invoices.forEach((invoice: any) => {
      if (invoice.lines && Array.isArray(invoice.lines)) {
        invoice.lines.forEach((line: any) => {
          const itemId = line.itemId || line.description;
          const itemName = line.description || 'Unknown Item';
          const lineTotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);

          if (!itemStats[itemId]) {
            itemStats[itemId] = { name: itemName, sales: 0, count: 0 };
          }

          itemStats[itemId].sales += lineTotal;
          itemStats[itemId].count += Number(line.quantity || 0);
        });
      }
    });

    return Object.values(itemStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const recentActivities = [
    ...stats.recentInvoices.map((inv: any) => ({
      id: inv.id,
      type: 'invoice',
      title: `Invoice ${inv.invoiceNumber} created`,
      client: inv.customer?.name || 'N/A',
      amount: Number(inv.total || 0),
      time: formatTimeAgo(inv.invoiceDate),
      status: inv.status,
    })),
    ...stats.recentPayments.map((pay: any) => ({
      id: pay.id,
      type: 'payment',
      title: 'Payment received',
      client: pay.customer?.name || 'N/A',
      amount: Number(pay.amount || 0),
      time: formatTimeAgo(pay.paymentDate),
      status: 'success',
    })),
    ...stats.recentQuotes.map((quote: any) => ({
      id: quote.id,
      type: 'quote',
      title: `Quote ${quote.quoteNumber} ${quote.status}`,
      client: quote.customer?.name || 'N/A',
      amount: Number(quote.total || 0),
      time: formatTimeAgo(quote.quoteDate),
      status: quote.status,
    })),
  ].slice(0, 5);

  const upcomingTasks = [
    { id: 1, title: 'Follow up with Microsoft', dueDate: 'Today', priority: 'high' },
    { id: 2, title: 'Send proposal to ABC Company', dueDate: 'Tomorrow', priority: 'medium' },
    { id: 3, title: 'Review expense reports', dueDate: 'Nov 10', priority: 'low' },
    { id: 4, title: 'Client meeting - Techprogramming', dueDate: 'Nov 12', priority: 'high' },
  ];

  function formatTimeAgo(dateString: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }

  const salesPipelineData = [
    { name: 'Draft', value: stats.quotesByStatus.draft || 0, color: '#8884d8' },
    { name: 'Sent', value: stats.quotesByStatus.sent || 0, color: '#83a6ed' },
    { name: 'Pending', value: stats.quotesByStatus.pending || 0, color: '#8dd1e1' },
    { name: 'Accepted', value: stats.quotesByStatus.accepted || 0, color: '#82ca9d' },
    { name: 'Rejected', value: stats.quotesByStatus.rejected || 0, color: '#ff8042' },
  ];

  const topProductsData = stats.topItems.length > 0 ? stats.topItems : [
    { name: 'No data', sales: 0, count: 0 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'payment': return <DollarOutlined style={{ color: '#52c41a' }} />;
      case 'quote': return <FileTextOutlined style={{ color: '#722ed1' }} />;
      case 'customer': return <UserOutlined style={{ color: '#fa8c16' }} />;
      case 'expense': return <ShoppingOutlined style={{ color: '#f5222d' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '16px' }}>
        <Spin size="large" />
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#000000', minHeight: '100vh' }}>
      {/* Header with Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Welcome back! Here's what's happening with your business today.</Text>
        </div>
        <Select
          defaultValue="month"
          style={{ width: 150 }}
          onChange={(value) => console.log('Period changed:', value)}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' },
          ]}
        />
      </div>

      {/* Top Stats Cards - Modern Design */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>Total Revenue</span>}
              value={stats.totalRevenue}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
              suffix={
                <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                  <ArrowUpOutlined /> 12.5%
                </span>
              }
            />
            <div style={{ marginTop: 8, color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
              <RiseOutlined /> vs last month
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>Total Invoices</span>}
              value={stats.totalInvoices}
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
              suffix={
                <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                  <ArrowUpOutlined /> 8.2%
                </span>
              }
            />
            <div style={{ marginTop: 8, color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
              <FileTextOutlined /> {stats.invoicesByStatus.pending || 0} pending
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>Total Customers</span>}
              value={stats.totalCustomers}
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
              suffix={
                <span style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                  <ArrowUpOutlined /> {stats.customerGrowth}%
                </span>
              }
            />
            <div style={{ marginTop: 8, color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
              <TeamOutlined /> Active customers
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>Unpaid Amount</span>}
              value={stats.unpaidAmount}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
            />
            <div style={{ marginTop: 8, color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
              <ClockCircleOutlined /> Awaiting payment
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Revenue Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Revenue Overview</span>
                <Space>
                  <Button size="small">Revenue</Button>
                  <Button size="small">Profit</Button>
                  <Button size="small">Expenses</Button>
                </Space>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#667eea" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Sales Pipeline */}
        <Col xs={24} lg={8}>
          <Card
            title="Sales Pipeline"
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesPipelineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesPipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              {salesPipelineData.map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Space>
                    <div style={{ width: 12, height: 12, background: item.color, borderRadius: 2 }} />
                    <Text>{item.name}</Text>
                  </Space>
                  <Text strong>{item.value}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customer Growth & Top Products */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Customer Growth"
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.customersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', r: 5 }}
                  name="Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Top Products/Services"
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Bar dataKey="sales" fill="#667eea" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity & Tasks */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BellOutlined />
                <span>Recent Activity</span>
                <Badge count={recentActivities.length} />
              </Space>
            }
            variant="borderless"
            extra={<Button type="link" size="small">View All</Button>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar icon={getActivityIcon(item.type)} style={{ backgroundColor: '#f0f0f0' }} />
                    }
                    title={
                      <div>
                        <Text strong>{item.title}</Text>
                        {item.amount > 0 && (
                          <Text style={{ float: 'right', color: item.type === 'payment' ? '#52c41a' : '#666' }}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </Text>
                        )}
                      </div>
                    }
                    description={item.client}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Upcoming Tasks</span>
                <Badge count={upcomingTasks.length} />
              </Space>
            }
            variant="borderless"
            extra={<Button type="link" size="small">Add Task</Button>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Timeline
              items={upcomingTasks.map(task => ({
                dot: <ClockCircleOutlined style={{ fontSize: 16}} />,
                color: task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'blue',
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{task.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> {task.dueDate}
                      </Text>
                    </div>
                    <Tag color={getPriorityColor(task.priority)}>{task.priority.toUpperCase()}</Tag>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Invoice & Quote Status Tables */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Invoice Status Overview"
            variant="borderless"
            extra={<Button type="link" size="small" icon={<EyeOutlined />}>View All</Button>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {[
              { status: 'Draft', count: stats.invoicesByStatus.draft || 0, color: '#d9d9d9' },
              { status: 'Pending', count: stats.invoicesByStatus.pending || 0, color: '#faad14' },
              { status: 'Partially Paid', count: stats.invoicesByStatus.partially || 0, color: '#1890ff' },
              { status: 'Paid', count: stats.invoicesByStatus.paid || 0, color: '#52c41a' },
            ].map(item => (
              <div key={item.status} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>{item.status}</Text>
                  <Text strong>{item.count}</Text>
                </div>
                <Progress 
                  percent={((item.count / stats.totalInvoices) * 100) || 0} 
                  strokeColor={item.color}
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Recent Invoices"
            variant="borderless"
            extra={<Button type="link" size="small" icon={<EyeOutlined />}>View All</Button>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={stats.recentInvoices}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              columns={[
                {
                  title: 'Invoice #',
                  dataIndex: 'invoiceNumber',
                  key: 'number',
                  width: 100,
                },
                {
                  title: 'Client',
                  dataIndex: ['customer', 'name'],
                  key: 'client',
                },
                {
                  title: 'Amount',
                  dataIndex: 'totalAmount',
                  key: 'amount',
                  render: (amount: number) => `₹${amount?.toLocaleString('en-IN')}`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: any = {
                      draft: 'default',
                      sent: 'blue',
                      paid: 'success',
                      partially_paid: 'orange',
                    };
                    return <Tag color={colors[status]}>{status}</Tag>;
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedDashboardPage;
