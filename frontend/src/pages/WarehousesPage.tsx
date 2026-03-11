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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import warehouseService, { Warehouse, StockLevel } from '../services/warehouse.service';

const { Title } = Typography;
const { Option } = Select;

const WarehousesPage: React.FC = () => {
  const { message } = App.useApp();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWarehouses();
  }, [activeFilter]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehouseService.findAll({
        is_active: activeFilter,
      });
      setWarehouses(data);
    } catch (error: any) {
      message.error('Failed to fetch warehouses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWarehouse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    form.setFieldsValue(warehouse);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await warehouseService.delete(id);
      message.success('Warehouse deleted successfully');
      fetchWarehouses();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingWarehouse) {
        await warehouseService.update(editingWarehouse.id, values);
        message.success('Warehouse updated successfully');
      } else {
        await warehouseService.create(values);
        message.success('Warehouse created successfully');
      }
      setIsModalVisible(false);
      fetchWarehouses();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save warehouse');
    }
  };

  const handleViewStock = async (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsStockModalVisible(true);
    try {
      setStockLoading(true);
      const stock = await warehouseService.getStockLevels(warehouse.id);
      setStockLevels(stock);
    } catch (error: any) {
      message.error('Failed to load stock levels');
      console.error(error);
    } finally {
      setStockLoading(false);
    }
  };

  const warehouseColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Address',
      key: 'address',
      width: 300,
      render: (_: any, record: Warehouse) => {
        const parts = [
          record.address_line1,
          record.address_line2,
          record.city,
          record.state,
          record.postal_code,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '—';
      },
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 120,
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button
            icon={<InboxOutlined />}
            onClick={() => handleViewStock(record)}
            size="small"
            type="link"
          >
            Stock
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" type="link" />
          <Popconfirm
            title="Delete Warehouse"
            description="Are you sure you want to delete this warehouse?"
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

  const stockColumns = [
    {
      title: 'Item',
      dataIndex: ['item', 'name'],
      key: 'item',
      render: (text: string, record: StockLevel) => text || record.item_id,
    },
    {
      title: 'On Hand',
      dataIndex: 'quantity_on_hand',
      key: 'quantity_on_hand',
      align: 'right' as const,
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved_quantity',
      key: 'reserved_quantity',
      align: 'right' as const,
    },
    {
      title: 'Available',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      align: 'right' as const,
      render: (qty: number) => (
        <Tag color={qty > 0 ? 'success' : qty < 0 ? 'error' : 'default'}>
          {qty}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <HomeOutlined /> Warehouses
      </Title>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Warehouse
          </Button>
        </Space>

        <Table
          columns={warehouseColumns}
          dataSource={warehouses}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} warehouses`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingWarehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText={editingWarehouse ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Warehouse Code"
            name="code"
            rules={[
              { required: true, message: 'Please enter warehouse code' },
              { pattern: /^[A-Z0-9-]+$/, message: 'Use uppercase letters, numbers, and hyphens only' },
            ]}
          >
            <Input placeholder="WH-001" disabled={!!editingWarehouse} />
          </Form.Item>

          <Form.Item
            label="Warehouse Name"
            name="name"
            rules={[{ required: true, message: 'Please enter warehouse name' }]}
          >
            <Input placeholder="Main Warehouse" />
          </Form.Item>

          <Form.Item label="Address Line 1" name="address_line1">
            <Input placeholder="Street address" />
          </Form.Item>

          <Form.Item label="Address Line 2" name="address_line2">
            <Input placeholder="Apt, suite, etc. (optional)" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item label="City" name="city" style={{ width: '200px' }}>
              <Input placeholder="City" />
            </Form.Item>

            <Form.Item label="State / Province" name="state" style={{ width: '150px' }}>
              <Input placeholder="State" />
            </Form.Item>

            <Form.Item label="Postal Code" name="postal_code" style={{ width: '120px' }}>
              <Input placeholder="ZIP" />
            </Form.Item>
          </Space>

          <Form.Item label="Country" name="country">
            <Select placeholder="Select country">
              <Option value="USA">United States</Option>
              <Option value="Canada">Canada</Option>
              <Option value="UK">United Kingdom</Option>
              <Option value="India">India</Option>
              <Option value="Germany">Germany</Option>
              <Option value="France">France</Option>
              <Option value="Australia">Australia</Option>
              <Option value="Japan">Japan</Option>
              <Option value="China">China</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Status" name="is_active" initialValue={true}>
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stock Levels Modal */}
      <Modal
        title={`Stock Levels - ${selectedWarehouse?.name}`}
        open={isStockModalVisible}
        onCancel={() => setIsStockModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsStockModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Table
          columns={stockColumns}
          dataSource={stockLevels}
          rowKey="item_id"
          loading={stockLoading}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default WarehousesPage;
