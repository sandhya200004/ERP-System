import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tag,
  App,
  Row,
  Col,
  Statistic,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import vendorService, { Vendor, CreateVendorDto, VendorStatistics } from '../services/vendor.service';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const VendorsPage: React.FC = () => {
  const { message } = App.useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [statistics, setStatistics] = useState<VendorStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVendors();
    fetchStatistics();
  }, [searchText, activeFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorService.findAll({
        search: searchText || undefined,
        is_active: activeFilter,
      });
      setVendors(data);
    } catch (error: any) {
      message.error('Failed to fetch vendors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await vendorService.getStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleCreate = () => {
    setEditingVendor(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.setFieldsValue({
      name: vendor.name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      tax_id: vendor.tax_id,
      address_line1: vendor.address_line1,
      address_line2: vendor.address_line2,
      city: vendor.city,
      state: vendor.state,
      postal_code: vendor.postal_code,
      country: vendor.country,
      default_currency_code: vendor.default_currency_code,
      payment_terms_days: vendor.payment_terms_days,
      credit_limit: vendor.credit_limit,
      notes: vendor.notes,
      is_active: vendor.is_active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await vendorService.delete(id);
      message.success('Vendor deleted successfully');
      fetchVendors();
      fetchStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const handleSubmit = async (values: CreateVendorDto) => {
    try {
      if (editingVendor) {
        await vendorService.update(editingVendor.id, values);
        message.success('Vendor updated successfully');
      } else {
        await vendorService.create(values);
        message.success('Vendor created successfully');
      }
      setIsModalVisible(false);
      fetchVendors();
      fetchStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const columns = [
    {
      title: 'Vendor #',
      dataIndex: 'vendor_number',
      key: 'vendor_number',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Payment Terms',
      dataIndex: 'payment_terms_days',
      key: 'payment_terms_days',
      width: 130,
      render: (days: number) => (days ? `${days} days` : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Vendor) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" type="link" />
          <Popconfirm
            title="Delete Vendor"
            description="Are you sure you want to delete this vendor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" type="link" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ShopOutlined /> Vendors Management
      </Title>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic title="Total Vendors" value={statistics.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Vendors"
                value={statistics.active}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Inactive Vendors"
                value={statistics.inactive}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="Search vendors..."
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              onChange={setActiveFilter}
              value={activeFilter}
            >
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Vendor
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={vendors}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} vendors`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingVendor ? 'Edit Vendor' : 'Create New Vendor'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText={editingVendor ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Vendor Name"
                name="name"
                rules={[{ required: true, message: 'Please enter vendor name' }]}
              >
                <Input placeholder="Enter vendor name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contact_person">
                <Input placeholder="Enter contact person" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input placeholder="vendor@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tax ID" name="tax_id">
                <Input placeholder="Enter tax ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Currency" name="default_currency_code">
                <Select placeholder="Select currency">
                  <Option value="USD">USD - US Dollar</Option>
                  <Option value="EUR">EUR - Euro</Option>
                  <Option value="GBP">GBP - British Pound</Option>
                  <Option value="INR">INR - Indian Rupee</Option>
                  <Option value="JPY">JPY - Japanese Yen</Option>
                  <Option value="CAD">CAD - Canadian Dollar</Option>
                  <Option value="AUD">AUD - Australian Dollar</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Address Line 1" name="address_line1">
            <Input placeholder="Street address" />
          </Form.Item>

          <Form.Item label="Address Line 2" name="address_line2">
            <Input placeholder="Apt, suite, etc. (optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="City" name="city">
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="State / Province" name="state">
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Postal Code" name="postal_code">
                <Input placeholder="Postal code" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Country" name="country">
            <Input placeholder="Country" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Payment Terms (Days)" name="payment_terms_days">
                <InputNumber
                  placeholder="30"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Credit Limit" name="credit_limit">
                <InputNumber
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes about the vendor" />
          </Form.Item>

          <Form.Item label="Status" name="is_active" initialValue={true}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorsPage;
