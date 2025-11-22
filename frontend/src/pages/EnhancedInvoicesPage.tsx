import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  message,
  Drawer,
  Tabs,
  Row,
  Col,
  Statistic,
  DatePicker,
  Typography,
  Tooltip,
  Dropdown,
  Checkbox,
  Badge,
  Timeline,
  Descriptions,
  Divider,
  Steps,
  Progress,
  List,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  MailOutlined,
  CopyOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  SendOutlined,
  PrinterOutlined,
  MoreOutlined,
  LinkOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Step } = Steps;

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  issueDate: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paidAmount: number;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  recurring?: RecurringConfig;
  remindersSent: number;
  lastReminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface RecurringConfig {
  enabled: boolean;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: string;
  endDate?: string;
  nextInvoiceDate: string;
}

const EnhancedInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Modals
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [isRecurringModalVisible, setIsRecurringModalVisible] = useState(false);
  const [isPaymentLinkModalVisible, setIsPaymentLinkModalVisible] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    draftInvoices: 0,
    sentInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    overdueAmount: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    // Simulated data - replace with actual API call
    setTimeout(() => {
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2025-001',
          customer: {
            id: '1',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@techcorp.in',
            company: 'Tech Corp India Pvt Ltd',
          },
          issueDate: '2025-11-01',
          dueDate: '2025-12-01',
          amount: 100000,
          tax: 18000,
          total: 118000,
          status: 'Sent',
          paymentStatus: 'Unpaid',
          paidAmount: 0,
          items: [
            { id: '1', description: 'Web Development Services', quantity: 1, rate: 100000, amount: 100000 },
          ],
          notes: 'Thank you for your business!',
          terms: 'Payment due within 30 days',
          remindersSent: 1,
          lastReminderDate: '2025-11-05',
          createdAt: '2025-11-01',
          updatedAt: '2025-11-05',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2025-002',
          customer: {
            id: '2',
            name: 'Priya Sharma',
            email: 'priya.sharma@innovate.com',
            company: 'Innovate Solutions',
          },
          issueDate: '2025-10-15',
          dueDate: '2025-11-15',
          amount: 75000,
          tax: 13500,
          total: 88500,
          status: 'Paid',
          paymentStatus: 'Paid',
          paidAmount: 88500,
          items: [
            { id: '1', description: 'Digital Marketing Campaign', quantity: 1, rate: 75000, amount: 75000 },
          ],
          notes: 'Paid via UPI on Nov 5, 2025',
          terms: 'Payment due within 30 days',
          remindersSent: 0,
          createdAt: '2025-10-15',
          updatedAt: '2025-11-05',
        },
        {
          id: '3',
          invoiceNumber: 'INV-2025-003',
          customer: {
            id: '3',
            name: 'Amit Patel',
            email: 'amit.patel@startupindia.in',
            company: 'Startup India',
          },
          issueDate: '2025-09-20',
          dueDate: '2025-10-20',
          amount: 50000,
          tax: 9000,
          total: 59000,
          status: 'Overdue',
          paymentStatus: 'Partial',
          paidAmount: 30000,
          items: [
            { id: '1', description: 'Mobile App Development', quantity: 1, rate: 50000, amount: 50000 },
          ],
          notes: 'Partial payment received',
          terms: 'Payment due within 30 days',
          remindersSent: 3,
          lastReminderDate: '2025-11-01',
          createdAt: '2025-09-20',
          updatedAt: '2025-11-01',
        },
        {
          id: '4',
          invoiceNumber: 'INV-2025-004',
          customer: {
            id: '4',
            name: 'Sneha Reddy',
            email: 'sneha.reddy@globalenterprises.in',
            company: 'Global Enterprises',
          },
          issueDate: '2025-11-05',
          dueDate: '2025-12-05',
          amount: 150000,
          tax: 27000,
          total: 177000,
          status: 'Viewed',
          paymentStatus: 'Unpaid',
          paidAmount: 0,
          items: [
            { id: '1', description: 'Enterprise Software License', quantity: 1, rate: 150000, amount: 150000 },
          ],
          terms: 'Payment due within 30 days',
          remindersSent: 0,
          recurring: {
            enabled: true,
            frequency: 'Monthly',
            startDate: '2025-11-05',
            nextInvoiceDate: '2025-12-05',
          },
          createdAt: '2025-11-05',
          updatedAt: '2025-11-06',
        },
        {
          id: '5',
          invoiceNumber: 'INV-2025-005',
          customer: {
            id: '5',
            name: 'Vikram Singh',
            email: 'vikram.singh@oldcompany.com',
            company: 'Old Company Ltd',
          },
          issueDate: '2025-11-07',
          dueDate: '2025-12-07',
          amount: 25000,
          tax: 4500,
          total: 29500,
          status: 'Draft',
          paymentStatus: 'Unpaid',
          paidAmount: 0,
          items: [
            { id: '1', description: 'Consulting Services', quantity: 2, rate: 12500, amount: 25000 },
          ],
          terms: 'Payment due within 30 days',
          remindersSent: 0,
          createdAt: '2025-11-07',
          updatedAt: '2025-11-07',
        },
      ];
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  };

  const fetchStats = () => {
    setStats({
      totalInvoices: 5,
      draftInvoices: 1,
      sentInvoices: 1,
      paidInvoices: 1,
      overdueInvoices: 1,
      totalAmount: 518000,
      paidAmount: 118500,
      unpaidAmount: 370500,
      overdueAmount: 29000,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Sent': return 'processing';
      case 'Viewed': return 'blue';
      case 'Overdue': return 'error';
      case 'Draft': return 'default';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircleOutlined />;
      case 'Sent': return <MailOutlined />;
      case 'Viewed': return <EyeOutlined />;
      case 'Overdue': return <ExclamationCircleOutlined />;
      case 'Draft': return <FileTextOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Unpaid': return 'default';
      default: return 'default';
    }
  };

  const showDrawer = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDrawerVisible(true);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    Modal.confirm({
      title: 'Send Invoice',
      content: `Send invoice ${invoice.invoiceNumber} to ${invoice.customer.email}?`,
      okText: 'Send',
      onOk() {
        message.success(`Invoice sent to ${invoice.customer.email}`);
        fetchInvoices();
      },
    });
  };

  const handleSendReminder = () => {
    if (!selectedInvoice) return;
    message.success(`Payment reminder sent to ${selectedInvoice.customer.email}`);
    setIsReminderModalVisible(false);
    fetchInvoices();
  };

  const handleBulkAction = (action: string) => {
    if (selectedInvoices.length === 0) {
      message.warning('Please select invoices first');
      return;
    }

    Modal.confirm({
      title: `${action} ${selectedInvoices.length} invoice(s)?`,
      content: `Are you sure you want to ${action.toLowerCase()} the selected invoices?`,
      okText: 'Yes',
      onOk() {
        message.success(`${selectedInvoices.length} invoice(s) ${action.toLowerCase()}ed successfully`);
        setSelectedInvoices([]);
        fetchInvoices();
      },
    });
  };

  const generatePaymentLink = () => {
    if (!selectedInvoice) return;
    const link = `https://triverse.app/pay/${selectedInvoice.id}`;
    navigator.clipboard.writeText(link);
    message.success('Payment link copied to clipboard!');
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      invoice.customer.company.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || invoice.paymentStatus === paymentFilter;
    
    // Tab filters
    let matchesTab = true;
    if (activeTab === 'draft') matchesTab = invoice.status === 'Draft';
    if (activeTab === 'sent') matchesTab = invoice.status === 'Sent' || invoice.status === 'Viewed';
    if (activeTab === 'paid') matchesTab = invoice.paymentStatus === 'Paid';
    if (activeTab === 'overdue') matchesTab = invoice.status === 'Overdue';
    if (activeTab === 'recurring') matchesTab = invoice.recurring?.enabled === true;
    
    return matchesSearch && matchesStatus && matchesPayment && matchesTab;
  });

  const moreActionsMenu = (invoice: Invoice): MenuProps['items'] => [
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => message.success('Invoice duplicated'),
    },
    {
      key: 'convert',
      icon: <FileTextOutlined />,
      label: 'Convert to Quote',
      onClick: () => message.success('Converted to quote'),
    },
    {
      key: 'recurring',
      icon: <ReloadOutlined />,
      label: 'Set Recurring',
      onClick: () => {
        setSelectedInvoice(invoice);
        setIsRecurringModalVisible(true);
      },
    },
    { type: 'divider' },
    {
      key: 'cancel',
      icon: <ExclamationCircleOutlined />,
      label: 'Cancel Invoice',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Cancel Invoice',
          content: `Are you sure you want to cancel ${invoice.invoiceNumber}?`,
          okText: 'Yes',
          okType: 'danger',
          onOk() {
            message.success('Invoice cancelled');
            fetchInvoices();
          },
        });
      },
    },
  ];

  const columns: ColumnsType<Invoice> = [
    {
      title: (
        <Checkbox
          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
          indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices(filteredInvoices.map(inv => inv.id));
            } else {
              setSelectedInvoices([]);
            }
          }}
        />
      ),
      key: 'checkbox',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedInvoices.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedInvoices([...selectedInvoices, record.id]);
            } else {
              setSelectedInvoices(selectedInvoices.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150,
      render: (number, record) => (
        <Space direction="vertical" size={0}>
          <Button type="link" onClick={() => showDrawer(record)} style={{ padding: 0, height: 'auto' }}>
            <Text strong>{number}</Text>
          </Button>
          {record.recurring?.enabled && (
            <Tag color="purple" icon={<ReloadOutlined />} style={{ fontSize: 11 }}>
              Recurring
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar style={{ background: '#667eea' }}>
            {record.customer.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.customer.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.customer.company}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date, record) => {
        const isOverdue = dayjs(date).isBefore(dayjs()) && record.status !== 'Paid';
        return (
          <Text type={isOverdue ? 'danger' : 'secondary'}>
            {dayjs(date).format('MMM DD, YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      sorter: (a, b) => a.total - b.total,
      render: (amount) => (
        <Text strong style={{ color: '#667eea' }}>
          ₹{amount.toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      title: 'Payment',
      key: 'payment',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={getPaymentStatusColor(record.paymentStatus)}>
            {record.paymentStatus}
          </Tag>
          {record.paymentStatus === 'Partial' && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              ₹{record.paidAmount.toLocaleString('en-IN')} paid
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showDrawer(record)}
            />
          </Tooltip>
          {record.status !== 'Paid' && (
            <Tooltip title="Send">
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSendInvoice(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Download">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => message.success('Downloading invoice...')}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => message.info('Opening invoice builder...')}
            />
          </Tooltip>
          <Dropdown menu={{ items: moreActionsMenu(record) }} trigger={['click']}>
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <FileTextOutlined style={{ marginRight: 12 }} />
          Invoice Management
        </Title>
        <Text type="secondary">Create, manage, and track your invoices with advanced automation</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              prefix="₹"
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid Amount"
              value={stats.paidAmount}
              prefix="₹"
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  ({Math.round((stats.paidAmount / stats.totalAmount) * 100)}%)
                </Text>
              }
            />
            <Progress
              percent={Math.round((stats.paidAmount / stats.totalAmount) * 100)}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue Amount"
              value={stats.overdueAmount}
              prefix="₹"
              valueStyle={{ color: '#ff4d4f' }}
              suffix={
                <Badge count={stats.overdueInvoices} style={{ backgroundColor: '#ff4d4f' }} />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Space>
              <Button icon={<SettingOutlined />}>Templates</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => message.info('Opening invoice builder...')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                Create Invoice
              </Button>
            </Space>
          }
        >
          <TabPane tab={`All (${invoices.length})`} key="all" />
          <TabPane tab={`Draft (${stats.draftInvoices})`} key="draft" />
          <TabPane tab={`Sent (${stats.sentInvoices})`} key="sent" />
          <TabPane tab={`Paid (${stats.paidInvoices})`} key="paid" />
          <TabPane tab={`Overdue (${stats.overdueInvoices})`} key="overdue" />
          <TabPane tab="Recurring" key="recurring" />
        </Tabs>
      </Card>

      {/* Filters and Bulk Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle" wrap>
              <Input
                placeholder="Search invoices..."
                prefix={<SearchOutlined />}
                style={{ width: 280 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Status"
                style={{ width: 140 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Sent">Sent</Select.Option>
                <Select.Option value="Viewed">Viewed</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Overdue">Overdue</Select.Option>
              </Select>
              <Select
                placeholder="Payment"
                style={{ width: 140 }}
                value={paymentFilter}
                onChange={setPaymentFilter}
              >
                <Select.Option value="all">All Payments</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Partial">Partial</Select.Option>
                <Select.Option value="Unpaid">Unpaid</Select.Option>
              </Select>
              <RangePicker />
              <Button icon={<FilterOutlined />}>More Filters</Button>
            </Space>
          </Col>
          {selectedInvoices.length > 0 && (
            <Col>
              <Space>
                <Text strong>{selectedInvoices.length} selected</Text>
                <Button icon={<SendOutlined />} onClick={() => handleBulkAction('Send')}>
                  Send
                </Button>
                <Button icon={<DownloadOutlined />} onClick={() => handleBulkAction('Download')}>
                  Download
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => handleBulkAction('Delete')}>
                  Delete
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredInvoices}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} invoices`,
          }}
        />
      </Card>

      {/* Invoice Details Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ fontSize: 24, color: '#667eea' }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {selectedInvoice?.invoiceNumber}
              </div>
              <Text type="secondary">{selectedInvoice?.customer.company}</Text>
            </div>
          </Space>
        }
        placement="right"
        width={720}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        extra={
          <Space>
            <Button icon={<PrinterOutlined />}>Print</Button>
            <Button icon={<DownloadOutlined />}>Download</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => selectedInvoice && handleSendInvoice(selectedInvoice)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              Send Invoice
            </Button>
          </Space>
        }
      >
        {selectedInvoice && (
          <>
            {/* Invoice Status Timeline */}
            <Card style={{ marginBottom: 16 }}>
              <Steps current={selectedInvoice.status === 'Draft' ? 0 : selectedInvoice.status === 'Sent' ? 1 : selectedInvoice.status === 'Viewed' ? 2 : 3} size="small">
                <Step title="Created" icon={<FileTextOutlined />} />
                <Step title="Sent" icon={<SendOutlined />} />
                <Step title="Viewed" icon={<EyeOutlined />} />
                <Step title="Paid" icon={<CheckCircleOutlined />} />
              </Steps>
            </Card>

            {/* Invoice Details */}
            <Card title="Invoice Information" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Invoice Number">
                  {selectedInvoice.invoiceNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag icon={getStatusIcon(selectedInvoice.status)} color={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Issue Date">
                  {dayjs(selectedInvoice.issueDate).format('MMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  {dayjs(selectedInvoice.dueDate).format('MMM DD, YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Customer">
                  {selectedInvoice.customer.name}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedInvoice.customer.email}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Subtotal"
                    value={selectedInvoice.amount}
                    prefix="₹"
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Tax (18%)"
                    value={selectedInvoice.tax}
                    prefix="₹"
                    valueStyle={{ fontSize: 18 }}
                  />
                </Col>
              </Row>

              <Divider />

              <Statistic
                title="Total Amount"
                value={selectedInvoice.total}
                prefix="₹"
                valueStyle={{ fontSize: 24, color: '#667eea', fontWeight: 600 }}
              />

              {selectedInvoice.paymentStatus !== 'Unpaid' && (
                <>
                  <Divider />
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Paid Amount"
                        value={selectedInvoice.paidAmount}
                        prefix="₹"
                        valueStyle={{ fontSize: 18, color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Balance Due"
                        value={selectedInvoice.total - selectedInvoice.paidAmount}
                        prefix="₹"
                        valueStyle={{ fontSize: 18, color: '#ff4d4f' }}
                      />
                    </Col>
                  </Row>
                </>
              )}
            </Card>

            {/* Line Items */}
            <Card title="Line Items" style={{ marginBottom: 16 }}>
              <List
                dataSource={selectedInvoice.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.description}
                      description={`Quantity: ${item.quantity} × ₹${item.rate.toLocaleString('en-IN')}`}
                    />
                    <Text strong style={{ fontSize: 16, color: '#667eea' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>

            {/* Payment Actions */}
            {selectedInvoice.paymentStatus !== 'Paid' && (
              <Card title="Payment Actions" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    block
                    icon={<LinkOutlined />}
                    onClick={() => {
                      setIsPaymentLinkModalVisible(true);
                    }}
                  >
                    Generate Payment Link
                  </Button>
                  <Button
                    block
                    icon={<BellOutlined />}
                    onClick={() => {
                      setSelectedInvoice(selectedInvoice);
                      setIsReminderModalVisible(true);
                    }}
                  >
                    Send Payment Reminder
                  </Button>
                  {selectedInvoice.remindersSent > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedInvoice.remindersSent} reminder(s) sent. Last: {dayjs(selectedInvoice.lastReminderDate).format('MMM DD, YYYY')}
                    </Text>
                  )}
                </Space>
              </Card>
            )}

            {/* Recurring Invoice Info */}
            {selectedInvoice.recurring?.enabled && (
              <Card title="Recurring Invoice" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Frequency">
                    {selectedInvoice.recurring.frequency}
                  </Descriptions.Item>
                  <Descriptions.Item label="Next Invoice">
                    {dayjs(selectedInvoice.recurring.nextInvoiceDate).format('MMM DD, YYYY')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Started">
                    {dayjs(selectedInvoice.recurring.startDate).format('MMM DD, YYYY')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card title="Activity Timeline">
              <Timeline>
                <Timeline.Item color="green">
                  <Text strong>Invoice Created</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(selectedInvoice.createdAt).format('MMM DD, YYYY HH:mm')}
                  </Text>
                </Timeline.Item>
                {selectedInvoice.status !== 'Draft' && (
                  <Timeline.Item color="blue">
                    <Text strong>Invoice Sent</Text>
                    <br />
                    <Text type="secondary">Sent to {selectedInvoice.customer.email}</Text>
                  </Timeline.Item>
                )}
                {selectedInvoice.status === 'Viewed' && (
                  <Timeline.Item color="purple">
                    <Text strong>Invoice Viewed</Text>
                    <br />
                    <Text type="secondary">Customer opened the invoice</Text>
                  </Timeline.Item>
                )}
                {selectedInvoice.remindersSent > 0 && (
                  <Timeline.Item color="orange">
                    <Text strong>Payment Reminder Sent</Text>
                    <br />
                    <Text type="secondary">
                      {dayjs(selectedInvoice.lastReminderDate).format('MMM DD, YYYY')}
                    </Text>
                  </Timeline.Item>
                )}
                {selectedInvoice.paymentStatus === 'Paid' && (
                  <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                    <Text strong>Payment Received</Text>
                    <br />
                    <Text type="secondary">
                      ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')} paid
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </>
        )}
      </Drawer>

      {/* Payment Reminder Modal */}
      <Modal
        title="Send Payment Reminder"
        open={isReminderModalVisible}
        onOk={handleSendReminder}
        onCancel={() => setIsReminderModalVisible(false)}
        okText="Send Reminder"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Send a payment reminder to:</Text>
          <Text strong>{selectedInvoice?.customer.email}</Text>
          <Divider />
          <Text type="secondary">
            This will send an automated email reminder about the pending payment for invoice{' '}
            {selectedInvoice?.invoiceNumber}.
          </Text>
        </Space>
      </Modal>

      {/* Payment Link Modal */}
      <Modal
        title="Payment Link"
        open={isPaymentLinkModalVisible}
        onCancel={() => setIsPaymentLinkModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPaymentLinkModalVisible(false)}>
            Close
          </Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={generatePaymentLink}>
            Copy Link
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Share this payment link with your customer:</Text>
          <Input
            value={`https://triverse.app/pay/${selectedInvoice?.id}`}
            readOnly
            suffix={
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={generatePaymentLink}
              />
            }
          />
          <Divider />
          <Text type="secondary">
            Customers can use this link to pay online via UPI, Card, or Net Banking.
          </Text>
        </Space>
      </Modal>

      {/* Recurring Invoice Modal */}
      <Modal
        title="Set Recurring Invoice"
        open={isRecurringModalVisible}
        onCancel={() => setIsRecurringModalVisible(false)}
        onOk={() => {
          message.success('Recurring invoice configured!');
          setIsRecurringModalVisible(false);
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Frequency" name="frequency">
            <Select placeholder="Select frequency">
              <Select.Option value="Weekly">Weekly</Select.Option>
              <Select.Option value="Monthly">Monthly</Select.Option>
              <Select.Option value="Quarterly">Quarterly</Select.Option>
              <Select.Option value="Yearly">Yearly</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Start Date" name="startDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="End Date (Optional)" name="endDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedInvoicesPage;
