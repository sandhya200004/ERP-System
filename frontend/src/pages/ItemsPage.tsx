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
  InputNumber,
  Select,
  Popconfirm,
  Tag,
  App,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { itemService } from '../services/item.service';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Item {
  id: string;
  itemNumber: string;
  itemType: string;
  name: string;
  description: string;
  unitPrice: number;
  isActive: boolean;
}

const ItemsPage: React.FC = () => {
  const { message } = App.useApp();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemService.getAll({});
      setItems(response.data);
    } catch (error: any) {
      message.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await itemService.delete(id);
      message.success('Item deleted successfully');
      fetchItems();
    } catch (error: any) {
      message.error('Failed to delete item');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await itemService.update(editingItem.id, values);
        message.success('Item updated successfully');
      } else {
        await itemService.create(values);
        message.success('Item created successfully');
      }
      setIsModalVisible(false);
      fetchItems();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const columns = [
    {
      title: 'Item #',
      dataIndex: 'itemNumber',
      key: 'itemNumber',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (type: string) => (
        type ? <Tag color={type === 'goods' ? 'blue' : 'green'}>{type.toUpperCase()}</Tag> : '-'
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => price != null ? `₹${price.toLocaleString('en-IN')}` : '₹0',
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
      render: (_: any, record: Item) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          <Popconfirm
            title="Are you sure you want to delete this item?"
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
          <Title level={2}>Items</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Item
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Edit Item' : 'Add Item'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width="90%"
        style={{ maxWidth: 600 }}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="itemType"
            label="Item Type"
            rules={[{ required: true, message: 'Please select item type' }]}
          >
            <Select placeholder="Select item type">
              <Option value="goods">Goods</Option>
              <Option value="service">Service</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter item name' }]}
          >
            <Input placeholder="Enter item name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter item description" />
          </Form.Item>

          <Form.Item name="sku" label="SKU">
            <Input placeholder="Enter SKU" />
          </Form.Item>

          <Form.Item
            name="unitPrice"
            label="Unit Price"
            rules={[{ required: true, message: 'Please enter unit price' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
              placeholder="0.00"
              prefix="$"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ItemsPage;
