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
    customerGrowth: 30,
    unpaidAmount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [customerStats, itemStats, invoiceStats, invoicesData] = await Promise.all([
        customerService.getStats(),
        itemService.getStats(),
        invoiceService.getStats(),
        invoiceService.getAll(),
      ]);

      const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || [];

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
        declined: 0,
        accepted: 0,
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

      setStats({
        totalCustomers: customerStats.total || 0,
        totalItems: itemStats.total || 0,
        totalInvoices: invoiceStats.total || 0,
        totalRevenue: invoiceStats.totalRevenue || 0,
        invoicesByStatus,
        quotesByStatus,
        recentInvoices: invoices.slice(0, 5),
        recentQuotes: [],
        customerGrowth: 30,
        unpaidAmount,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
    { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
    { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
    { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000 },
    { month: 'Jul', revenue: 72000, expenses: 42000, profit: 30000 },
  ];

  const salesPipelineData = [
    { name: 'Leads', value: 45, color: '#8884d8' },
    { name: 'Proposals', value: 28, color: '#83a6ed' },
    { name: 'Negotiations', value: 18, color: '#8dd1e1' },
    { name: 'Won', value: 35, color: '#82ca9d' },
    { name: 'Lost', value: 12, color: '#ff8042' },
  ];

  const customerGrowthData = [
    { month: 'Jan', customers: 120 },
    { month: 'Feb', customers: 145 },
    { month: 'Mar', customers: 168 },
    { month: 'Apr', customers: 195 },
    { month: 'May', customers: 220 },
    { month: 'Jun', customers: 258 },
    { month: 'Jul', customers: 285 },
  ];

  const topProductsData = [
    { name: 'Web Development', sales: 125000, count: 12 },
    { name: 'UI/UX Design', sales: 95000, count: 18 },
    { name: 'Digital Marketing', sales: 78000, count: 25 },
    { name: 'SaaS Development', sales: 150000, count: 5 },
    { name: 'Consulting', sales: 65000, count: 15 },
  ];

  const recentActivities = [
    { 
      id: 1, 
      type: 'invoice', 
      title: 'Invoice #32 created', 
      client: 'Microsoftp', 
      amount: 47600, 
      time: '2 hours ago',
      status: 'draft'
    },
    { 
      id: 2, 
      type: 'payment', 
      title: 'Payment received', 
      client: 'Techprogramming', 
      amount: 28084, 
      time: '4 hours ago',
      status: 'success'
    },
    { 
      id: 3, 
      type: 'quote', 
      title: 'Quote #9 accepted', 
      client: 'Techprogramming', 
      amount: 22000, 
      time: '6 hours ago',
      status: 'accepted'
    },
    { 
      id: 4, 
      type: 'customer', 
      title: 'New customer added', 
      client: 'ABC Company', 
      amount: 0, 
      time: '1 day ago',
      status: 'new'
    },
    { 
      id: 5, 
      type: 'expense', 
      title: 'Expense approved', 
      client: 'Office Supplies', 
      amount: 2500, 
      time: '1 day ago',
      status: 'approved'
    },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Follow up with Microsoftp', dueDate: 'Today', priority: 'high' },
    { id: 2, title: 'Send proposal to ABC Company', dueDate: 'Tomorrow', priority: 'medium' },
    { id: 3, title: 'Review expense reports', dueDate: 'Nov 10', priority: 'low' },
    { id: 4, title: 'Client meeting - Techprogramming', dueDate: 'Nov 12', priority: 'high' },
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
    <div style={{ padding: '0 0 24px 0' }}>
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
              <AreaChart data={revenueData}>
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
                <Tooltip />
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
              <LineChart data={customerGrowthData}>
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
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
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
