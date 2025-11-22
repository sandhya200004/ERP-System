import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, message, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { invoiceService } from '../services/invoice.service';
import InvoiceBuilder from '../components/InvoiceBuilder';

const { Title } = Typography;

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  invoiceDate: string;
  dueDate: string;
  customer: {
    name: string;
  };
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [builderVisible, setBuilderVisible] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getAll({});
      setInvoices(response.data);
    } catch (error: any) {
      message.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'default',
      final: 'blue',
      sent: 'cyan',
      partially_paid: 'orange',
      paid: 'success',
      overdue: 'error',
      void: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
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
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Amount Paid',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Amount Due',
      dataIndex: 'amountDue',
      key: 'amountDue',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Invoices</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBuilderVisible(true)}>
            Create Invoice
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <InvoiceBuilder
        visible={builderVisible}
        onClose={() => setBuilderVisible(false)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};

export default InvoicesPage;
