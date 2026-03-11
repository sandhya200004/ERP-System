import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Badge,
  Dropdown,
  Menu,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  platformAdminService,
  Company,
  PlatformStats,
  CreateCompanyDto,
} from '../../services/platform-admin.service';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const PlatformAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Subdomain validation state
  const [subdomainCheck, setSubdomainCheck] = useState<{
    status: 'validating' | 'success' | 'error' | '';
    message: string;
    previewUrl?: string;
  }>({ status: '', message: '' });
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  const currentAdmin = platformAdminService.getCurrentAdmin();

  useEffect(() => {
    if (!platformAdminService.isAuthenticated()) {
      navigate('/platform-admin/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, companiesData] = await Promise.all([
        platformAdminService.getStats(),
        platformAdminService.getCompanies(pagination.current, pagination.pageSize),
      ]);
      setStats(statsData);
      setCompanies(companiesData.data);
      setPagination({ ...pagination, total: companiesData.total });
    } catch (error: any) {
      message.error('Failed to load data');
      if (error.response?.status === 401 || error.response?.status === 403) {
        platformAdminService.logout();
        navigate('/platform-admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced subdomain checker
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainCheck({ status: '', message: '' });
      return;
    }

    setCheckingSubdomain(true);
    setSubdomainCheck({ status: 'validating', message: 'Checking availability...' });

    try {
      const result = await platformAdminService.checkSubdomain(subdomain);
      
      if (result.available && result.valid) {
        setSubdomainCheck({
          status: 'success',
          message: result.message,
          previewUrl: result.preview_url,
        });
      } else {
        setSubdomainCheck({
          status: 'error',
          message: result.message + (result.suggestion ? ` Try: ${result.suggestion}` : ''),
        });
      }
    } catch (error) {
      setSubdomainCheck({
        status: 'error',
        message: 'Failed to check subdomain availability',
      });
    } finally {
      setCheckingSubdomain(false);
    }
  };

  // Debounce timer
  let subdomainCheckTimeout: NodeJS.Timeout;
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    form.setFieldsValue({ subdomain: value });
    
    clearTimeout(subdomainCheckTimeout);
    subdomainCheckTimeout = setTimeout(() => {
      checkSubdomainAvailability(value);
    }, 500);
  };

  const handleCreateCompany = async (values: CreateCompanyDto) => {
    try {
      await platformAdminService.createCompany({
        ...values,
        subscription_plan: values.subscription_plan || 'trial',
        max_users: values.max_users || 10,
        max_branches: values.max_branches || 5,
        max_storage_gb: values.max_storage_gb || 10,
      });
      message.success('Company created successfully!');
      setCreateModalVisible(false);
      form.resetFields();
      setSubdomainCheck({ status: '', message: '' });
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create company');
    }
  };

  const handleSuspend = async (id: string) => {
    Modal.confirm({
      title: 'Suspend Company',
      content: (
        <Input.TextArea
          placeholder="Enter suspension reason..."
          id="suspension-reason"
          rows={4}
        />
      ),
      onOk: async () => {
        const reason =
          (document.getElementById('suspension-reason') as HTMLTextAreaElement)?.value || 'No reason provided';
        try {
          await platformAdminService.suspendCompany(id, reason);
          message.success('Company suspended');
          loadData();
        } catch (error) {
          message.error('Failed to suspend company');
        }
      },
    });
  };

  const handleReactivate = async (id: string) => {
    try {
      await platformAdminService.reactivateCompany(id);
      message.success('Company reactivated');
      loadData();
    } catch (error) {
      message.error('Failed to reactivate company');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Company',
      content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await platformAdminService.deleteCompany(id);
          message.success('Company deleted');
          loadData();
        } catch (error) {
          message.error('Failed to delete company');
        }
      },
    });
  };

  const handleLogout = () => {
    platformAdminService.logout();
    navigate('/platform-admin/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="admin" disabled>
        <UserOutlined /> {currentAdmin?.first_name} {currentAdmin?.last_name}
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {currentAdmin?.email}
        </Text>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" danger onClick={handleLogout}>
        <LogoutOutlined /> Logout
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Company) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.subdomain}.myerp.com
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          active: 'green',
          trial: 'orange',
          suspended: 'red',
        };
        const icons: any = {
          active: <CheckCircleOutlined />,
          trial: <ClockCircleOutlined />,
          suspended: <StopOutlined />,
        };
        return (
          <Tag color={colors[status]} icon={icons[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'subscription_plan',
      width: 120,
      render: (plan: string) => (
        <Badge
          color={plan === 'enterprise' ? 'purple' : plan === 'professional' ? 'blue' : 'default'}
          text={plan.charAt(0).toUpperCase() + plan.slice(1)}
        />
      ),
    },
    {
      title: 'Users',
      dataIndex: 'max_users',
      key: 'max_users',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Company) => (
        <Space size="small">
          {record.status === 'suspended' ? (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleReactivate(record.id)}
            >
              Reactivate
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleSuspend(record.id)}
              danger
            >
              Suspend
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.name)}
            danger
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout className="page-transition-wrapper" style={{ minHeight: '100vh', animation: 'fadeIn 0.5s ease-in' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Platform Admin Panel
        </Title>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Button icon={<UserOutlined />}>
            {currentAdmin?.first_name} {currentAdmin?.is_super_admin && <Badge count="SUPER" />}
          </Button>
        </Dropdown>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Companies"
                value={stats?.totalCompanies || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active"
                value={stats?.activeCompanies || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Trial"
                value={stats?.trialCompanies || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Suspended"
                value={stats?.suspendedCompanies || 0}
                prefix={<StopOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Companies Table */}
        <Card
          title="Companies"
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Create Company
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize: pageSize! });
                loadData();
              },
            }}
          />
        </Card>
      </Content>

      {/* Create Company Modal */}
      <Modal
        title="Create New Company"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
          setSubdomainCheck({ status: '', message: '' });
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCompany}>
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="e.g., Acme Corporation" />
          </Form.Item>

          <Form.Item
            name="subdomain"
            label="Subdomain"
            validateStatus={subdomainCheck.status === 'validating' ? 'validating' : subdomainCheck.status}
            hasFeedback={subdomainCheck.status !== ''}
            help={
              subdomainCheck.message && (
                <div>
                  <div>{subdomainCheck.message}</div>
                  {subdomainCheck.previewUrl && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        🔗 URL: <Text code copyable>{subdomainCheck.previewUrl}</Text>
                      </Text>
                    </div>
                  )}
                </div>
              )
            }
            rules={[
              { required: true, message: 'Please enter subdomain' },
              {
                pattern: /^[a-z0-9-]+$/,
                message: 'Only lowercase letters, numbers, and hyphens',
              },
              { min: 3, message: 'At least 3 characters required' },
              { max: 63, message: 'Maximum 63 characters allowed' },
              {
                validator: (_, value) => {
                  if (value && (value.startsWith('-') || value.endsWith('-'))) {
                    return Promise.reject('Cannot start or end with hyphen');
                  }
                  if (subdomainCheck.status === 'error') {
                    return Promise.reject(subdomainCheck.message);
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input 
              placeholder="acme" 
              addonAfter=".myerp.com"
              onChange={handleSubdomainChange}
              disabled={checkingSubdomain}
            />
          </Form.Item>

          <Title level={5}>Administrator Account</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="admin_first_name"
                label="First Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="admin_last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="admin_email"
            label="Admin Email"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="admin@acme.com" />
          </Form.Item>

          <Form.Item
            name="admin_password"
            label="Admin Password"
            rules={[
              { required: true, message: 'Required' },
              { min: 8, message: 'Minimum 8 characters' },
            ]}
          >
            <Input.Password placeholder="Min 8 characters" />
          </Form.Item>

          <Title level={5}>Subscription Details</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subscription_plan" label="Plan" initialValue="trial">
                <Select>
                  <Select.Option value="trial">Trial</Select.Option>
                  <Select.Option value="basic">Basic</Select.Option>
                  <Select.Option value="professional">Professional</Select.Option>
                  <Select.Option value="enterprise">Enterprise</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_users" label="Max Users" initialValue={10}>
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="max_branches" label="Max Branches" initialValue={5}>
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_storage_gb" label="Storage (GB)" initialValue={10}>
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Company
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default PlatformAdminDashboard;
