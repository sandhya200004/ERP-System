import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Card, Tag, App } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
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
  const { message } = App.useApp();
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
      console.log('Fetched invoices:', response);
      
      // Map the API response to match the interface
      const mappedInvoices = (response.data || []).map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        totalAmount: parseFloat(invoice.total) || 0,
        amountPaid: parseFloat(invoice.amount_paid) || 0,
        amountDue: parseFloat(invoice.amount_due) || 0,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        customer: {
          name: invoice.customers?.name || 'Unknown',
        },
      }));
      
      setInvoices(mappedInvoices);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
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
    <div className="page-transition-wrapper" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Invoices</Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchInvoices} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBuilderVisible(true)}>
              Create Invoice
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
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
