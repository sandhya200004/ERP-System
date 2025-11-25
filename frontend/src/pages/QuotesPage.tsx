import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Typography, Modal, Form, Input, Select, DatePicker, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { quoteService } from '../services/quote.service';
import type { Quote } from '../services/quote.service';
import { customerService } from '../services/customer.service';

const { Title } = Typography;
const { TextArea } = Input;

const QuotesPage: React.FC = () => {
  const { message } = App.useApp();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchQuotes();
    fetchCustomers();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await quoteService.getAll();
      setQuotes(data);
    } catch (error) {
      message.error('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleAdd = () => {
    setEditingQuote(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Quote) => {
    setEditingQuote(record);
    form.setFieldsValue({
      ...record,
      customerId: record.customerId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await quoteService.delete(id);
      message.success('Quote deleted successfully');
      fetchQuotes();
    } catch (error) {
      message.error('Failed to delete quote');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingQuote) {
        await quoteService.update(editingQuote.id, values);
        message.success('Quote updated successfully');
      } else {
        await quoteService.create(values);
        message.success('Quote created successfully');
      }
      setModalVisible(false);
      fetchQuotes();
    } catch (error) {
      message.error('Failed to save quote');
    }
  };

  const columns = [
    {
      title: 'Quote #',
      dataIndex: 'quoteNumber',
      key: 'quoteNumber',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Quote Date',
      dataIndex: 'quoteDate',
      key: 'quoteDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `$${Number(value).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          draft: 'default',
          sent: 'processing',
          accepted: 'success',
          declined: 'error',
          expired: 'warning',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Quote) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">View</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>Quotes</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Quote
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingQuote ? 'Edit Quote' : 'Add Quote'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select placeholder="Select customer">
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="quoteDate" label="Quote Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="validUntil" label="Valid Until" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotesPage;
