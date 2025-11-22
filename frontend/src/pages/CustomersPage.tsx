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
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { customerService } from '../services/customer.service';

const { Title } = Typography;
const { Option } = Select;

interface Customer {
  id: string;
  customerNumber: string;
  customerType: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll({});
      setCustomers(response.data);
    } catch (error: any) {
      message.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await customerService.delete(id);
      message.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error: any) {
      message.error('Failed to delete customer');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Remove fields that are not in the backend DTO
      const { website, ...validData } = values;
      
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, validData);
        message.success('Customer updated successfully');
      } else {
        await customerService.create(validData);
        message.success('Customer created successfully');
      }
      setIsModalVisible(false);
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const columns = [
    {
      title: 'Customer #',
      dataIndex: 'customerNumber',
      key: 'customerNumber',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      render: (type: string) => (
        <Tag color={type === 'BUSINESS' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Customers</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Customer
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="customerType"
            label="Customer Type"
            rules={[{ required: true, message: 'Please select customer type' }]}
          >
            <Select placeholder="Select customer type">
              <Option value="business">Business</Option>
              <Option value="individual">Individual</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item name="phone" label="Phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item name="billingAddressLine1" label="Address">
            <Input placeholder="Enter billing address" />
          </Form.Item>

          <Form.Item name="billingCity" label="City">
            <Input placeholder="Enter city" />
          </Form.Item>

          <Form.Item name="billingCountry" label="Country">
            <Input placeholder="Enter country" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
